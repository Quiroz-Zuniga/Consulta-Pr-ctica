export interface IStorageService {
  uploadPdf(pdfBuffer: Buffer, fileName: string): Promise<string>;
}
