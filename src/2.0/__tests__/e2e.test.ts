import {
  IdentityProofType as v2IdentityProofType,
  OpenAttestationDocument as v2OpenAttestationDocument
} from "../../__generated__/schema.2.0";
import { wrapDocument, sign, ProofType } from "../..";
import { ethers } from "ethers";

const openAttestationDatav2: v2OpenAttestationDocument & { foo: string } = {
  issuers: [
    {
      name: "John",
      identityProof: {
        type: v2IdentityProofType.DNSTxt,
        location: "tradetrust.io"
      },
      documentStore: "0x9178F546D3FF57D7A6352bD61B80cCCD46199C2d"
    }
  ],
  foo: "bar"
};

describe("2.0 E2E Test Scenarios", () => {
  describe("Issuing a single documents", () => {
    test("should create a wrapped 2.0 document", async () => {
      const wrappedDocument = await wrapDocument(openAttestationDatav2);
      expect(wrappedDocument.data.foo).toEqual(expect.stringContaining("bar"));
      expect(wrappedDocument.signature.type).toBe("SHA3MerkleProof");
      expect(wrappedDocument.signature.targetHash).toBeDefined();
      expect(wrappedDocument.signature.merkleRoot).toBeDefined();
      expect(wrappedDocument.signature.proof).toEqual([]);
      expect(wrappedDocument.signature.merkleRoot).toBe(wrappedDocument.signature.targetHash);
    });
    test("should create a wrapped 2.0 document with a signed proof block", async () => {
      const wrappedDocument = await wrapDocument(openAttestationDatav2);
      const options = {
        privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
        verificationMethod: "0x14791697260E4c9A71f18484C9f997B308e59325",
        type: ProofType.EcdsaSecp256k1Signature2019
      };
      const signed = await sign(wrappedDocument, options);
      const { proof } = signed;
      if (!proof) throw new Error("No proof!");
      const msg = wrappedDocument.signature.targetHash;
      const recoverAddress = ethers.utils.verifyMessage(msg, proof.signature);
      expect(recoverAddress.toLowerCase()).toStrictEqual(options.verificationMethod.toLowerCase());
    });
    test("should create a wrapped 2.0 document when issuer contains additional data", async () => {
      const wrappedDocument = await wrapDocument({
        ...openAttestationDatav2,
        issuers: [
          {
            ...openAttestationDatav2.issuers[0],
            url: "https://some.example.io"
          }
        ]
      });
      expect(wrappedDocument.data.foo).toEqual(expect.stringContaining("bar"));
      expect(wrappedDocument.signature.type).toBe("SHA3MerkleProof");
      expect(wrappedDocument.signature.targetHash).toBeDefined();
      expect(wrappedDocument.signature.merkleRoot).toBeDefined();
      expect(wrappedDocument.signature.proof).toEqual([]);
      expect(wrappedDocument.signature.merkleRoot).toBe(wrappedDocument.signature.targetHash);
    });
  });
});