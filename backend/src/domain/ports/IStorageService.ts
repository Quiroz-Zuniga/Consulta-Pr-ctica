export interface IStorageService {
  uploadPdf(pdfBuffer: Buffer, fileName: string, token?: string): Promise<string>;
}
