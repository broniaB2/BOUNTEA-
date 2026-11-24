import { initialBounties } from "../data/mockBounties";

export function getInitialBounties() {
  return initialBounties.map((bounty) => ({ ...bounty }));
}

export function getBountyById(bounties, id) {
  return bounties.find((bounty) => String(bounty.id) === String(id));
}

export function filterBounties(bounties, search, category) {
  const normalizedSearch = search.trim().toLowerCase();

  return bounties.filter((bounty) => {
    const matchesSearch =
      bounty.title.toLowerCase().includes(normalizedSearch) ||
      bounty.description.toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      category === "All" || bounty.category === category;

    return matchesSearch && matchesCategory;
  });
}

export function createMockBounty(form, user) {
  return {
    id: Date.now(),
    ...form,
    reward: Number(form.reward),
    skills: [form.category],
    business: user?.name || "Your Business",
    createdBy: user?.email,
    network: "Stellar Testnet",
    status: "OPEN",
  };
}

export function claimMockBounty(bounties, id, worker = "Precious") {
  const bounty = getBountyById(bounties, id);

  if (!bounty) {
    return { success: false, error: "This bounty could not be found." };
  }

  if (bounty.status !== "OPEN") {
    return {
      success: false,
      error: "This bounty is no longer available to claim.",
    };
  }

  return {
    success: true,
    bounty: {
      ...bounty,
      status: "CLAIMED",
      claimedBy: worker,
    },
  };
}

export function getClaimedBounties(bounties, worker = "Precious") {
  return bounties.filter((bounty) => bounty.claimedBy === worker);
}

export function startMockTask(bounties, id) {
  const bounty = getBountyById(bounties, id);

  if (!bounty) {
    return { success: false, error: "This task could not be found." };
  }

  if (bounty.status !== "CLAIMED") {
    return {
      success: false,
      error: "Only claimed tasks can be started.",
    };
  }

  return {
    success: true,
    bounty: { ...bounty, status: "IN_PROGRESS" },
  };
}

function createSubmission(bounty, submission) {
  return {
    id: `submission-${Date.now()}`,
    bountyId: bounty.id,
    workerName: bounty.claimedBy || "Precious",
    clientName: bounty.business,
    submittedAt: new Date().toLocaleDateString(),
    ...submission,
    status: "SUBMITTED",
    paymentStatus: "NOT_STARTED",
  };
}

export function submitMockWork(bounties, id, submission) {
  const bounty = getBountyById(bounties, id);

  if (!bounty) {
    return { success: false, error: "This task could not be found." };
  }

  if (bounty.status !== "IN_PROGRESS") {
    return {
      success: false,
      error: "Only tasks in progress can receive a submission.",
    };
  }

  return {
    success: true,
    bounty: { ...bounty, status: "SUBMITTED" },
    submission: createSubmission(bounty, submission),
  };
}

export function resubmitMockWork(bounties, submissions, id, submission) {
  const bounty = getBountyById(bounties, id);
  const existingSubmission = submissions.find(
    (item) => String(item.bountyId) === String(id),
  );

  if (!bounty || !existingSubmission) {
    return { success: false, error: "The revision could not be found." };
  }

  if (
    bounty.status !== "IN_PROGRESS" ||
    existingSubmission.status !== "REVISION_REQUESTED"
  ) {
    return {
      success: false,
      error: "Only submissions with requested revisions can be resubmitted.",
    };
  }

  return {
    success: true,
    bounty: { ...bounty, status: "SUBMITTED" },
    submission: {
      ...existingSubmission,
      ...submission,
      status: "SUBMITTED",
      submittedAt: new Date().toLocaleDateString(),
      revisionFeedback: "",
      paymentStatus: "NOT_STARTED",
    },
  };
}

export function requestRevisionMock(bounties, submissions, submissionId, feedback) {
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    return { success: false, error: "This submission could not be found." };
  }

  if (submission.status !== "SUBMITTED") {
    return {
      success: false,
      error: "Only submitted work can be sent back for revision.",
    };
  }

  if (typeof feedback !== "string" || !feedback.trim()) {
    return { success: false, error: "Revision feedback is required." };
  }

  const bounty = getBountyById(bounties, submission.bountyId);

  if (!bounty || bounty.status !== "SUBMITTED") {
    return {
      success: false,
      error: "This submission is no longer available for review.",
    };
  }

  return {
    success: true,
    bounty: { ...bounty, status: "IN_PROGRESS" },
    submission: {
      ...submission,
      status: "REVISION_REQUESTED",
      revisionFeedback: feedback.trim(),
    },
  };
}

export function approveMockSubmission(bounties, submissions, submissionId) {
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    return { success: false, error: "This submission could not be found." };
  }

  if (submission.status !== "SUBMITTED") {
    return {
      success: false,
      error: "Only submitted work can be approved.",
    };
  }

  const bounty = getBountyById(bounties, submission.bountyId);

  if (!bounty || bounty.status !== "SUBMITTED") {
    return {
      success: false,
      error: "This submission is no longer available for approval.",
    };
  }

  return {
    success: true,
    bounty: { ...bounty, status: "COMPLETED" },
    submission: {
      ...submission,
      status: "APPROVED",
      paymentStatus: "AWAITING_PAYMENT",
    },
  };
}
