import { Plus, X } from "lucide-react";

function BountyForm({ form, onChange, onSubmit, onClose }) {
  const updateField = (field) => (event) =>
    onChange({ ...form, [field]: event.target.value });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>Create a bounty</h2>
            <p>Publish a new opportunity on BOUNTEA.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close create bounty form"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            required
            placeholder="e.g. Translate product descriptions"
            value={form.title}
            onChange={updateField("title")}
          />
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            required
            placeholder="Describe the work that needs to be completed..."
            value={form.description}
            onChange={updateField("description")}
          />
          <label htmlFor="task-category">Category</label>
          <select
            id="task-category"
            value={form.category}
            onChange={updateField("category")}
          >
            <option>Research</option>
            <option>Translation</option>
            <option>Data</option>
            <option>Content</option>
          </select>
          <label htmlFor="task-acceptance">Review instructions (client agent acceptance criteria)</label>
          <textarea
            id="task-acceptance"
            placeholder="What must the deliverable contain for the client agent to approve? e.g. 'All 20 items translated into Luganda, no machine-translation artifacts.'"
            value={form.acceptanceCriteria || ""}
            onChange={updateField("acceptanceCriteria")}
          />
          <div className="form-row">
            <div>
              <label htmlFor="task-reward">Reward (USDC)</label>
              <input
                id="task-reward"
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="5.00"
                value={form.reward}
                onChange={updateField("reward")}
              />
            </div>
            <div>
              <label htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline"
                required
                placeholder="e.g. 2 days"
                value={form.deadline}
                onChange={updateField("deadline")}
              />
            </div>
          </div>
          <button type="submit" className="primary-button submit-button">
            Create bounty <Plus size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default BountyForm;
