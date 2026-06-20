import { FaissStore as OriginalFaissStore } from "@langchain/community/vectorstores/faiss";

declare module "@langchain/community/vectorstores/faiss" {
  export namespace FaissStore {
    /** Load an existing FAISS index from disk */
    function fromExistingIndex(
      indexPath: string,
      embeddings: any
    ): Promise<OriginalFaissStore>;
  }
}
