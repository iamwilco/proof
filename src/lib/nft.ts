import prisma from "./prisma";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  projectId: string;
  projectTitle: string;
  fundName: string;
  fundingAmount: string;
  completedAt: string;
  proposerName: string;
  milestones: number;
  verificationHash: string;
}

export interface MintRequest {
  projectId: string;
  proposerWallet: string;
  metadata: NFTMetadata;
}

export interface MintResult {
  success: boolean;
  txHash?: string;
  policyId?: string;
  assetId?: string;
  error?: string;
}

export interface VerificationRequest {
  nftId: string;
  verifierId: string;
  verifierWallet: string;
  approved: boolean;
  notes?: string;
}

export function generateNFTMetadata(project: {
  id: string;
  title: string;
  fundingAmount: number;
  completedAt?: Date | null;
  fund: { name: string };
  projectPeople: Array<{ person: { name: string }; isPrimary: boolean }>;
  milestones: Array<{ id: string }>;
}): NFTMetadata {
  const primaryProposer = project.projectPeople.find((pp) => pp.isPrimary);
  const proposerName = primaryProposer?.person.name || "Unknown";

  // Generate a verification hash from project data
  const verificationData = `${project.id}-${project.title}-${project.fundingAmount}-${project.completedAt?.toISOString() || "pending"}`;
  const verificationHash = Buffer.from(verificationData).toString("base64").slice(0, 32);

  return {
    name: `Catalyst Completion: ${project.title}`,
    description: `This NFT certifies the successful completion of "${project.title}" funded through Cardano Catalyst ${project.fund.name}.`,
    image: `https://proof.catalyst.io/nft/${project.id}/image.png`,
    projectId: project.id,
    projectTitle: project.title,
    fundName: project.fund.name,
    fundingAmount: `${project.fundingAmount} ADA`,
    completedAt: project.completedAt?.toISOString() || new Date().toISOString(),
    proposerName,
    milestones: project.milestones.length,
    verificationHash,
  };
}

export async function requestMint(projectId: string, proposerWallet: string): Promise<MintResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      fund: true,
      projectPeople: {
        include: { person: true },
      },
      milestones: true,
      completionNFT: true,
    },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  if (project.status !== "completed") {
    return { success: false, error: "Project must be completed to mint NFT" };
  }

  if (project.completionNFT?.mintStatus === "minted") {
    return { success: false, error: "NFT already minted for this project" };
  }

  const metadata = generateNFTMetadata({
    ...project,
    fundingAmount: Number(project.fundingAmount),
    completedAt: project.fundedAt,
  });

  // Create or update CompletionNFT record
  const nft = await prisma.completionNFT.upsert({
    where: { projectId },
    create: {
      projectId,
      proposerWallet,
      metadataJson: metadata as object,
      mintStatus: "pending",
      verificationStatus: "pending",
    },
    update: {
      proposerWallet,
      metadataJson: metadata as object,
      mintStatus: "pending",
    },
  });

  // In a real implementation, this would call NMKR or a minting service
  // For now, we simulate the minting process
  try {
    // Simulate API call to minting service
    const mockMintResult = await simulateMinting(nft.id, metadata);

    await prisma.completionNFT.update({
      where: { id: nft.id },
      data: {
        mintStatus: mockMintResult.success ? "minted" : "failed",
        mintTxHash: mockMintResult.txHash,
        policyId: mockMintResult.policyId,
        assetId: mockMintResult.assetId,
        mintedAt: mockMintResult.success ? new Date() : undefined,
        mintError: mockMintResult.error,
      },
    });

    return mockMintResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown minting error";

    await prisma.completionNFT.update({
      where: { id: nft.id },
      data: {
        mintStatus: "failed",
        mintError: errorMessage,
      },
    });

    return { success: false, error: errorMessage };
  }
}

async function simulateMinting(nftId: string, metadata: NFTMetadata): Promise<MintResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // In production, this would call NMKR API or similar
  // For now, return mock data
  const mockPolicyId = `policy_${Buffer.from(nftId).toString("hex").slice(0, 56)}`;
  const mockAssetId = `${mockPolicyId}.${metadata.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;
  const mockTxHash = `tx_${Buffer.from(metadata.verificationHash).toString("hex").slice(0, 64)}`;

  return {
    success: true,
    txHash: mockTxHash,
    policyId: mockPolicyId,
    assetId: mockAssetId,
  };
}

export async function verifyNFT(request: VerificationRequest): Promise<{ success: boolean; error?: string }> {
  const nft = await prisma.completionNFT.findUnique({
    where: { id: request.nftId },
  });

  if (!nft) {
    return { success: false, error: "NFT not found" };
  }

  if (nft.verificationStatus === "verified") {
    return { success: false, error: "NFT already verified" };
  }

  await prisma.completionNFT.update({
    where: { id: request.nftId },
    data: {
      verificationStatus: request.approved ? "verified" : "rejected",
      verifiedAt: new Date(),
      verifiedBy: request.verifierId,
      verifierWallet: request.verifierWallet,
    },
  });

  return { success: true };
}

export async function verifyProposerWallet(
  projectId: string,
  walletAddress: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  // In production, this would verify the wallet signature
  // For now, we just update the record
  const nft = await prisma.completionNFT.findUnique({
    where: { projectId },
  });

  if (!nft) {
    return { success: false, error: "No NFT record found for this project" };
  }

  // Mock signature verification
  const isValidSignature = signature.length > 10;

  if (!isValidSignature) {
    return { success: false, error: "Invalid wallet signature" };
  }

  await prisma.completionNFT.update({
    where: { id: nft.id },
    data: {
      proposerWallet: walletAddress,
      walletVerified: true,
    },
  });

  return { success: true };
}

export async function getNFTStats(): Promise<{
  total: number;
  minted: number;
  pending: number;
  verified: number;
}> {
  const [total, minted, pending, verified] = await Promise.all([
    prisma.completionNFT.count(),
    prisma.completionNFT.count({ where: { mintStatus: "minted" } }),
    prisma.completionNFT.count({ where: { mintStatus: "pending" } }),
    prisma.completionNFT.count({ where: { verificationStatus: "verified" } }),
  ]);

  return { total, minted, pending, verified };
}
