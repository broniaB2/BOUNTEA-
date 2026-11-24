import { useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, FileText } from "lucide-react";
import { getClaimedBounties } from "../services/bountyService";

const taskFilters = [
  { label: "All Tasks", value: "ALL" },
  { label: "Claimed", value: "CLAIMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Completed", value: "COMPLETED" },
];

const emptySubmission = {
  title: "",
  description: "",
  deliveryLink: "",
  notes: "",
};

function formatStatus(status) {
  return status.replace(/_/g, " ");
}

function TaskSummary({ icon: Icon, tone, label, value }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <span>Current worker tasks</span>
      </div>
    </div>
  );
}

function SubmissionForm({ task, form, isRevision, onChange, onSubmit, onCancel }) {
  const updateField = (field) => (event) =>
    onChange({ ...form, [field]: event.target.value });

  return (
    <form className="submission-form" onSubmit={onSubmit}>
      <div className="submission-form-heading">
        <div>
          <h3>{isRevision ? "Revise your submission" : "Submit completed work"}</h3>
          <p>
            {isRevision
              ? "Update your work and send it back to the client for review."
              : "Share a preview of your work for client review."}
          </p>
        </div>
        <span>{task.title}</span>
      </div>
      <label htmlFor={`submission-title-${task.id}`}>Submission title</label>
      <input
        id={`submission-title-${task.id}`}
        required
        value={form.title}
        onChange={updateField("title")}
        placeholder="e.g. Completed product descriptions"
      />
      <label htmlFor={`submission-description-${task.id}`}>Description</label>
      <textarea
        id={`submission-description-${task.id}`}
        required
        value={form.description}
        onChange={updateField("description")}
        placeholder="Describe the work you completed..."
      />
      <label htmlFor={`submission-link-${task.id}`}>Delivery link (optional)</label>
      <input
        id={`submission-link-${task.id}`}
        type="url"
        value={form.deliveryLink}
        onChange={updateField("deliveryLink")}
        placeholder="https://..."
      />
      <label htmlFor={`submission-notes-${task.id}`}>Additional notes (optional)</label>
      <textarea
        id={`submission-notes-${task.id}`}
        value={form.notes}
        onChange={updateField("notes")}
        placeholder="Add anything the client should know..."
      />
      <div className="submission-form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          <FileText size={17} />
          {isRevision ? "Resubmit work" : "Submit work"}
        </button>
      </div>
    </form>
  );
}

function MyTasks({
  bounties,
  submissions,
  worker,
  onStartTask,
  onSubmitWork,
  onResubmitWork,
}) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [submissionTaskId, setSubmissionTaskId] = useState(null);
  const [isRevision, setIsRevision] = useState(false);
  const [submissionForm, setSubmissionForm] = useState(emptySubmission);
  const [notice, setNotice] = useState("");

  const claimedTasks = useMemo(
    () => getClaimedBounties(bounties, worker),
    [bounties, worker],
  );
  const visibleTasks = claimedTasks.filter(
    (task) => activeFilter === "ALL" || task.status === activeFilter,
  );
  const summary = {
    claimed: claimedTasks.length,
    inProgress: claimedTasks.filter((task) => task.status === "IN_PROGRESS").length,
    submitted: claimedTasks.filter((task) => task.status === "SUBMITTED").length,
    completed: claimedTasks.filter((task) => task.status === "COMPLETED").length,
  };

  function handleStart(taskId) {
    const result = onStartTask(taskId);
    setNotice(result.success ? "Task started successfully." : result.error);
  }

  function handleSubmit(event, taskId) {
    event.preventDefault();
    const result = isRevision
      ? onResubmitWork(taskId, submissionForm)
      : onSubmitWork(taskId, submissionForm);
    if (!result.success) {
      setNotice(result.error);
      return;
    }
    setSubmissionTaskId(null);
    setIsRevision(false);
    setSubmissionForm(emptySubmission);
    setNotice(
      isRevision
        ? "Revised work resubmitted and is awaiting client review."
        : "Work submitted successfully and is awaiting client review.",
    );
  }

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>My Tasks</h1>
          <p className="page-description">
            Manage the bounties you have claimed and track your work.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <TaskSummary
          icon={BriefcaseBusiness}
          tone="purple"
          label="Total claimed tasks"
          value={summary.claimed}
        />
        <TaskSummary
          icon={Clock3}
          tone="blue"
          label="In progress"
          value={summary.inProgress}
        />
        <TaskSummary
          icon={FileText}
          tone="orange"
          label="Submitted for review"
          value={summary.submitted}
        />
        <TaskSummary
          icon={CheckCircle2}
          tone="green"
          label="Completed"
          value={summary.completed}
        />
      </section>

      <div className="task-filters" role="group" aria-label="Task status filters">
        {taskFilters.map((filter) => (
          <button
            key={filter.value}
            className={`filter-button ${
              activeFilter === filter.value ? "selected" : ""
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {notice && <div className="task-notice">{notice}</div>}

      {visibleTasks.length === 0 ? (
        <div className="empty-state">
          <BriefcaseBusiness size={35} />
          <h3>{claimedTasks.length ? "No matching tasks" : "No active tasks"}</h3>
          <p>
            {claimedTasks.length
              ? "Try another status filter."
              : "Claim a bounty from the marketplace to see it here."}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {visibleTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-card-main">
                <div className="bounty-card-top">
                  <span className="category-tag">{task.category}</span>
                  <span className={`status-tag status-${task.status.toLowerCase()}`}>
                    {formatStatus(task.status)}
                  </span>
                </div>
                <h2>{task.title}</h2>
                <p className="bounty-description">{task.business}</p>
                <div className="task-meta">
                  <span>${Number(task.reward).toFixed(2)} USDC</span>
                  {task.deadline && <span>Deadline: {task.deadline}</span>}
                </div>
              </div>
              <div className="task-card-action">
                {task.status === "CLAIMED" && (
                  <button className="primary-button" onClick={() => handleStart(task.id)}>
                    Start Task
                  </button>
                )}
                {task.status === "IN_PROGRESS" && (
                  <>
                    {submissions.find(
                      (submission) =>
                        String(submission.bountyId) === String(task.id) &&
                        submission.status === "REVISION_REQUESTED",
                    ) && (
                      <div className="revision-summary">
                        <strong>Revision required</strong>
                        <p>
                          {
                            submissions.find(
                              (submission) =>
                                String(submission.bountyId) === String(task.id),
                            ).revisionFeedback
                          }
                        </p>
                      </div>
                    )}
                    <button
                      className="primary-button"
                      onClick={() => {
                        const existingSubmission = submissions.find(
                          (submission) =>
                            String(submission.bountyId) === String(task.id) &&
                            submission.status === "REVISION_REQUESTED",
                        );
                        setSubmissionTaskId(task.id);
                        setIsRevision(Boolean(existingSubmission));
                        setSubmissionForm(
                          existingSubmission
                            ? {
                                title: existingSubmission.title || "",
                                description: existingSubmission.description || "",
                                deliveryLink: existingSubmission.deliveryLink || "",
                                notes: existingSubmission.notes || "",
                              }
                            : emptySubmission,
                        );
                        setNotice("");
                      }}
                    >
                      {submissions.some(
                        (submission) =>
                          String(submission.bountyId) === String(task.id) &&
                          submission.status === "REVISION_REQUESTED",
                      )
                        ? "Revise Submission"
                        : "Submit Work"}
                    </button>
                  </>
                )}
                {task.status === "SUBMITTED" && (
                  <span className="task-awaiting">Awaiting client review</span>
                )}
                {task.status === "COMPLETED" && (
                  <div className="task-completed-block">
                    <span className="task-completed">Completed</span>
                    {task.txHash && (
                      <a
                        className="view-receipt-link"
                        href={`https://stellar.expert/explorer/testnet/tx/${task.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on-chain receipt
                      </a>
                    )}
                    <a className="view-receipt-link" href="/receipts">
                      Open Receipts
                    </a>
                  </div>
                )}
              </div>
              {submissionTaskId === task.id && (
                <SubmissionForm
                  task={task}
                  form={submissionForm}
                  isRevision={isRevision}
                  onChange={setSubmissionForm}
                  onSubmit={(event) => handleSubmit(event, task.id)}
                  onCancel={() => {
                    setSubmissionTaskId(null);
                    setIsRevision(false);
                    setSubmissionForm(emptySubmission);
                  }}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTasks;
