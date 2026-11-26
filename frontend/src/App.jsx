import { useEffect, useMemo, useState } from "react";
import { api } from "./services/api";
import { buildAgentDeliverable } from "./services/agentService";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GuestRoute from "./components/auth/GuestRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import BountyForm from "./components/bounties/BountyForm";
import MainLayout from "./components/layout/MainLayout";
import { emptyBountyForm } from "./data/bountyForm";
import { bountyCategories } from "./data/mockBounties";
import BountyDetails from "./pages/BountyDetails";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import MyTasks from "./pages/MyTasks";
import NotFound from "./pages/NotFound";
import Submissions from "./pages/Submissions";
import Receipts from "./pages/Receipts";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import {
  createMockBounty,
  filterBounties,
  getInitialBounties,
  claimMockBounty,
  startMockTask,
  submitMockWork,
  resubmitMockWork,
  requestRevisionMock,
  approveMockSubmission,
} from "./services/bountyService";
import { initialSubmissions } from "./data/mockSubmissions";
import {
  getCurrentSession,
  mockLogout,
} from "./services/authService";

function App() {
  const [user, setUser] = useState(getCurrentSession);
  const [bounties, setBounties] = useState(getInitialBounties);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyBountyForm);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [receipts, setReceipts] = useState([]);
  const [spendingCap, setSpendingCap] = useState(12);
  const [backendOnline, setBackendOnline] = useState(false);

  // Hydrate tasks/receipts/cap from the BOUNTEA backend (x402 seller) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tasks, cfg, rcpts] = await Promise.all([
          api.listTasks(),
          api.config().catch(() => null),
          api.listReceipts().catch(() => []),
        ]);
        if (cancelled) return;
        if (Array.isArray(tasks) && tasks.length) {
          setBounties(tasks);
          // Derive submissions from backend tasks so both roles share state.
          const derived = tasks
            .filter((t) => t.submission)
            .map((t) => t.submission);
          setSubmissions(derived);
        }
        if (cfg && cfg.spendingCap) setSpendingCap(cfg.spendingCap);
        if (Array.isArray(rcpts)) setReceipts(rcpts);
        setBackendOnline(true);
      } catch {
        // Backend offline: keep mock data (demo still browsable).
        setBackendOnline(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll the backend so workers see bounties created in real time without a refresh.
  useEffect(() => {
    if (!backendOnline) return undefined;
    const refresh = async () => {
      try {
        const [tasks, rcpts] = await Promise.all([
          api.listTasks(),
          api.listReceipts().catch(() => []),
        ]);
        if (Array.isArray(tasks)) {
          setBounties(tasks);
          const derived = tasks
            .filter((task) => task.submission)
            .map((task) => task.submission);
          setSubmissions(derived);
        }
        if (Array.isArray(rcpts)) setReceipts(rcpts);
      } catch {
        // Keep the current state if the backend is temporarily unreachable.
      }
    };
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [backendOnline]);

  const filteredBounties = useMemo(
    () => filterBounties(bounties, search, category),
    [bounties, search, category],
  );

  function createBounty(event) {
    event.preventDefault();
    const mock = createMockBounty(form, user);
    // Optimistic local insert; sync to backend if online.
    setBounties((previous) => [mock, ...previous]);
    setForm(emptyBountyForm);
    setShowModal(false);
    if (backendOnline) {
      api
        .createTask(form, user)
        .then((created) => {
          setBounties((previous) =>
            previous.map((b) => (b.id === mock.id ? created : b)),
          );
        })
        .catch(() => {});
    }
  }

  function claimBounty(id) {
    const result = claimMockBounty(bounties, id, user?.name);
    if (result.success) {
      setBounties((previous) =>
        previous.map((bounty) => (bounty.id === id ? result.bounty : bounty)),
      );
    }
    if (backendOnline) {
      api.claimTask(id, user?.name).then((updated) => {
        setBounties((previous) =>
          previous.map((bounty) => (bounty.id === id ? updated : bounty)),
        );
      }).catch(() => {});
    }
    return result;
  }

  // Worker agent: after the human's go-ahead, claim → do the work → submit for review.
  async function runWorkerAgent(id) {
    const bounty = bounties.find((item) => String(item.id) === String(id));
    if (!bounty) return { success: false, error: "Task not found." };
    if (bounty.status !== "OPEN") {
      return { success: false, error: "This task is no longer open." };
    }

    const worker = user?.name || "worker-agent";
    let current = { ...bounty, status: "CLAIMED", claimedBy: worker };

    if (backendOnline) {
      try {
        const claimed = await api.claimTask(id, worker);
        if (claimed && claimed.id) current = claimed;
      } catch (error) {
        return { success: false, error: error.message || "Could not claim task." };
      }
    }

    const started = startMockTask([current], id);
    if (started.success) current = started.bounty;

    // Ask the server-side worker agent (Gemini) to do the work, but enforce a
    // 2-second time limit so agents stay competitive. Fall back to the offline
    // draft if Gemini is unavailable or too slow — never block the demo on it.
    let deliverable = buildAgentDeliverable(current);
    let source = "Offline draft agent";
    if (backendOnline) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        const generated = await api.generateAgentWork(id, { signal: controller.signal });
        if (generated?.deliverable) {
          deliverable = generated.deliverable;
          source = "Gemini worker agent";
        }
      } catch {
        // Gemini unavailable or too slow — keep the structured draft.
        source = "Offline draft agent (fast fallback)";
      } finally {
        clearTimeout(timeoutId);
      }
    }
    deliverable = {
      ...deliverable,
      notes: `${deliverable.notes || ""} [${source}]`.trim(),
    };

    const submitted = submitMockWork([current], id, deliverable);
    if (!submitted.success) return submitted;
    current = submitted.bounty;

    setBounties((previous) =>
      previous.map((item) => (String(item.id) === String(id) ? current : item)),
    );
    setSubmissions((previous) => [...previous, submitted.submission]);

    if (backendOnline) {
      try {
        const updated = await api.submitPreview(id, { ...deliverable, worker });
        if (updated && updated.id) {
          setBounties((previous) =>
            previous.map((item) =>
              String(item.id) === String(id) ? updated : item,
            ),
          );
          if (updated.submission) {
            setSubmissions((previous) => {
              const exists = previous.some(
                (item) => String(item.bountyId) === String(id),
              );
              return exists
                ? previous.map((item) =>
                    String(item.bountyId) === String(id)
                      ? updated.submission
                      : item,
                  )
                : [...previous, updated.submission];
            });
          }
        }
      } catch (error) {
        return { success: false, error: error.message || "Could not submit work." };
      }
    }

    return { success: true, submission: submitted.submission };
  }

  function startTask(id) {
    const result = startMockTask(bounties, id);
    if (result.success) {
      setBounties((previous) =>
        previous.map((bounty) => (bounty.id === id ? result.bounty : bounty)),
      );
    }
    return result;
  }

  function submitWork(id, submission) {
    const result = submitMockWork(bounties, id, submission);
    if (result.success) {
      setBounties((previous) =>
        previous.map((bounty) => (bounty.id === id ? result.bounty : bounty)),
      );
      setSubmissions((previous) => [...previous, result.submission]);
    }
    if (backendOnline) {
      api
        .submitPreview(id, {
          title: submission.title,
          description: submission.description,
          deliveryLink: submission.deliveryLink,
          notes: submission.notes,
          worker: user?.name,
        })
        .then((updated) => {
          if (updated && updated.submission) {
            setSubmissions((previous) => {
              const exists = previous.some(
                (item) => String(item.bountyId) === String(id),
              );
              if (exists) {
                return previous.map((item) =>
                  String(item.bountyId) === String(id) ? updated.submission : item,
                );
              }
              return [...previous, updated.submission];
            });
          }
          if (updated) {
            setBounties((previous) =>
              previous.map((b) => (b.id === id ? updated : b)),
            );
          }
        })
        .catch(() => {});
    }
    return result;
  }

  function resubmitWork(id, submission) {
    const result = resubmitMockWork(bounties, submissions, id, submission);
    if (result.success) {
      setBounties((previous) =>
        previous.map((bounty) => (bounty.id === id ? result.bounty : bounty)),
      );
      setSubmissions((previous) =>
        previous.map((item) =>
          item.id === result.submission.id ? result.submission : item,
        ),
      );
    }
    if (backendOnline) {
      api
        .submitPreview(id, {
          title: submission.title,
          description: submission.description,
          deliveryLink: submission.deliveryLink,
          notes: submission.notes,
          worker: user?.name,
          isRevision: true,
        })
        .then((updated) => {
          if (updated && updated.submission) {
            setSubmissions((previous) =>
              previous.map((item) =>
                String(item.bountyId) === String(id) ? updated.submission : item,
              ),
            );
          }
        })
        .catch(() => {});
    }
    return result;
  }

  function requestRevision(submissionId, feedback) {
    const submission = submissions.find((item) => item.id === submissionId);
    const bountyId = submission?.bountyId;
    const result = requestRevisionMock(
      bounties,
      submissions,
      submissionId,
      feedback,
    );
    if (result.success) {
      setBounties((previous) =>
        previous.map((bounty) =>
          bounty.id === result.bounty.id ? result.bounty : bounty,
        ),
      );
      setSubmissions((previous) =>
        previous.map((item) =>
          item.id === result.submission.id ? result.submission : item,
        ),
      );
    }
    if (backendOnline && bountyId) {
      api.requestRevision(bountyId, feedback).then((updated) => {
        if (updated) {
          setBounties((previous) =>
            previous.map((b) => (b.id === updated.id ? updated : b)),
          );
          if (updated.submission) {
            setSubmissions((previous) =>
              previous.map((item) =>
                String(item.bountyId) === String(bountyId)
                  ? updated.submission
                  : item,
              ),
            );
          }
        }
      }).catch(() => {});
    }
    return result;
  }

  function approveSubmission(submissionId) {
    const result = approveMockSubmission(
      bounties,
      submissions,
      submissionId,
    );
    if (result.success) {
      setBounties((previous) =>
        previous.map((bounty) =>
          bounty.id === result.bounty.id ? result.bounty : bounty,
        ),
      );
      setSubmissions((previous) =>
        previous.map((item) =>
          item.id === result.submission.id ? result.submission : item,
        ),
      );
    }
    return result;
  }

  async function approveAndPay(submissionId) {
    const submission = submissions.find((item) => item.id === submissionId);
    const bountyId = submission?.bountyId;
    if (!backendOnline || !bountyId) {
      // Fallback to mock approval when backend is offline.
      const result = approveSubmission(submissionId);
      return result;
    }
    try {
      const res = await api.approveAndPay(bountyId);
      if (res.receipt) {
        setReceipts((previous) => [res.receipt, ...previous]);
      }
      if (res.task) {
        setBounties((previous) =>
          previous.map((b) => (b.id === res.task.id ? res.task : b)),
        );
        if (res.task.submission) {
          setSubmissions((previous) =>
            previous.map((item) =>
              String(item.bountyId) === String(res.task.id)
                ? res.task.submission
                : item,
            ),
          );
        }
      }
      // Mirror into mock submissions state.
      setSubmissions((previous) =>
        previous.map((item) =>
          item.id === submissionId ? { ...item, status: "APPROVED", paymentStatus: "PAID" } : item,
        ),
      );
      return { success: true, receipt: res.receipt };
    } catch (e) {
      return { success: false, error: e.message || "Payment failed" };
    }
  }

  const pageProps = {
    bounties,
    filteredBounties,
    search,
    category,
    categories: bountyCategories,
    submissions,
    spendingCap,
    onSearchChange: setSearch,
    onCategoryChange: setCategory,
    onCreateBounty: () => setShowModal(true),
    onRunWorkerAgent: runWorkerAgent,
    user,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute user={user}>
              <Login onLogin={setUser} />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute user={user}>
              <Signup onLogin={setUser} />
            </GuestRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute user={user}>
              <MainLayout
                user={user}
                onLogout={() => {
                  mockLogout();
                  setUser(null);
                }}
                onCreateBounty={() => setShowModal(true)}
              />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <Dashboard
                {...pageProps}
                showBusinessActions={user?.role === "business"}
              />
            }
          />
          <Route
            path="/marketplace"
            element={<Marketplace {...pageProps} />}
          />
          <Route
            path="/marketplace/:id"
            element={
              <BountyDetails
                bounties={bounties}
                onClaimBounty={claimBounty}
                canClaim={user?.role === "worker"}
              />
            }
          />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute user={user} allowedRoles={["worker"]}>
                <MyTasks
                  bounties={bounties}
                  submissions={submissions}
                  worker={user?.name}
                  onStartTask={startTask}
                  onSubmitWork={submitWork}
                  onResubmitWork={resubmitWork}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions"
            element={
              <ProtectedRoute user={user} allowedRoles={["business"]}>
                <Submissions
                  bounties={bounties}
                  submissions={submissions}
                  user={user}
                  spendingCap={spendingCap}
                  backendOnline={backendOnline}
                  onApproveSubmission={approveSubmission}
                  onApproveAndPay={approveAndPay}
                  onRequestRevision={requestRevision}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <Receipts
                receipts={receipts}
                bounties={bounties}
                user={user}
                backendOnline={backendOnline}
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      {showModal && (
        user?.role === "business" && (
          <BountyForm
            form={form}
            onChange={setForm}
            onSubmit={createBounty}
            onClose={() => setShowModal(false)}
          />
        )
      )}
    </BrowserRouter>
  );
}

export default App;
