import { registerPlugin } from "@capacitor/core";

export interface PdfOpenerPlugin {
  open(options: { uri: string }): Promise<void>;
}

const PdfOpener = registerPlugin<PdfOpenerPlugin>("PdfOpener");

export default PdfOpener;
