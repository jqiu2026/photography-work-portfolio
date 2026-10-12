import { mockId } from "./store";

/** E-signature interface. The Phase 3 provider is a real e-sign service; this mock records a typed-name signature only. */
export type Envelope = { id: string; contractId: string; url: string; status: "sent" | "signed"; mock: true };
export type Signature = { envelopeId: string; signerName: string; signedAt: string; mock: true };

export interface ESignProvider {
  createEnvelope(contractId: string): Promise<Envelope>;
  sign(envelope: Envelope, input: { signerName: string; agree: boolean }): Promise<{ envelope: Envelope; signature: Signature }>;
}

export class MockESignProvider implements ESignProvider {
  constructor(private now: () => Date = () => new Date()) {}
  async createEnvelope(contractId: string): Promise<Envelope> {
    const id = mockId("env_mock");
    return { id, contractId, url: `/client/sign/${id}`, status: "sent", mock: true };
  }
  async sign(envelope: Envelope, input: { signerName: string; agree: boolean }) {
    const name = input.signerName.trim();
    if (name.length < 2) throw new Error("Type your full name to sign.");
    if (!input.agree) throw new Error("Tick the box to agree before signing.");
    if (envelope.status === "signed") throw new Error("This contract is already signed.");
    const signedAt = this.now().toISOString();
    return {
      envelope: { ...envelope, status: "signed" as const },
      signature: { envelopeId: envelope.id, signerName: name, signedAt, mock: true as const },
    };
  }
}
