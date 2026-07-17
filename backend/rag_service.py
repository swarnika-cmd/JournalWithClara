# backend/rag_service.py
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_nvidia_ai_endpoints import ChatNVIDIA, NVIDIAEmbeddings
from langchain_classic.chains import ConversationalRetrievalChain
from langchain_classic.memory import ConversationBufferWindowMemory

class RAGService:
    def __init__(self):
        self._embeddings = None
        self._llm = None
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            k=5  # Keep last 5 exchanges
        )
        self.chain = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            nvidia_key = os.getenv("NVIDIA_API_KEY")
            if not nvidia_key:
                raise ValueError("NVIDIA_API_KEY is not set in your .env file. Please add it to use the RAG service.")
            self._embeddings = NVIDIAEmbeddings(
                model="nvidia/llama-nemotron-embed-1b-v2",
                nvidia_api_key=nvidia_key
            )
        return self._embeddings

    @property
    def llm(self):
        if self._llm is None:
            nvidia_key = os.getenv("NVIDIA_API_KEY")
            if not nvidia_key:
                raise ValueError("NVIDIA_API_KEY is not set in your .env file. Please add it to use the RAG service.")
            self._llm = ChatNVIDIA(
                model="meta/llama-3.1-8b-instruct",
                nvidia_api_key=nvidia_key
            )
        return self._llm

    def ingest_document(self, file_path: str):
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500, chunk_overlap=50
        )
        chunks = splitter.split_documents(docs)
        vectorstore = Chroma.from_documents(chunks, self.embeddings)

        self.chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
            memory=self.memory,
        )

    def ask(self, question: str) -> str:
        if not self.chain:
            return "No document loaded yet. Please upload a document first."
        response = self.chain.invoke({"question": question})
        return response["answer"]
