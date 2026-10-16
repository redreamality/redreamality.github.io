---
title: "What is RAG architecture?"
description: "RAG (retrieval-augmented generation) architecture retrieves relevant passages from your documents before the model answers, then gives the passages and the question to the model together. The typical parts of a RAG system and where it usually fails."
date: 2026-10-16
tags: ["rag"]
lang: "en"
---

RAG architecture (retrieval-augmented generation) is a system design where a language model looks things up before it answers: when a user asks a question, the system retrieves the most relevant passages from an external knowledge base, puts them in the prompt with the question, and has the model answer from them.

The name comes from a 2020 paper by Patrick Lewis and colleagues at Meta AI. The problem it solves is practical. A model's knowledge stops at its training cutoff, and it has never seen your internal documents. Retraining is expensive; retrieving the right passages into the context is cheap, and the answer can cite its sources.

## The parts of a typical RAG system

A RAG system usually has an offline stage and an online stage.

Offline, you build the knowledge base. Parse documents into text, split the text into chunks of a few hundred words, turn each chunk into a vector with an embedding model, and store the vectors in a vector database, often alongside a keyword index.

Online, you answer questions. Embed the question, find the most similar chunks, and often run keyword search in parallel. A reranker model reorders the candidates, and the top few go into the prompt so the model can answer and cite them.

## Retrieval fails more often than generation

When a RAG system gets an answer wrong, the usual cause is that the right passage was never retrieved. Chunking split the context, a table or scanned PDF parsed badly, or the user's wording didn't match the document's, so pure vector search missed it. Measuring retrieval recall on its own usually helps more than switching to a stronger generation model.

In my view, long-context models and agents make "just paste the whole document" workable, but RAG is not obsolete. With many documents, access controls, or a need for checkable citations, a retrieval layer still saves money and effort. What has changed is that agents increasingly call retrieval as a tool when they need it, instead of the system searching on every question.

## Related reading

- [What is loop engineering?](/garden/questions/what-is-loop-engineering/)
- [Lewis et al.: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
