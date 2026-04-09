import { useState } from "react";
import { useAccessControl } from "../hooks/useContract";

const ROLE_OPTIONS = [
  { value: 0, label: "Admin" },
  { value: 1, label: "Patient" },
  { value: 2, label: "Doctor" },
  { value: 3, label: "Insurer" },
];

export default function AdminDashboard() {
  const accessControl = useAccessControl();

  const [registerAddress, setRegisterAddress] = useState("");
  const [registerRole, setRegisterRole] = useState(1);

  const [changeRoleAddress, setChangeRoleAddress] = useState("");
  const [newRole, setNewRole] = useState(1);

  const [statusAddress, setStatusAddress] = useState("");
  const [statusValue, setStatusValue] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const resetMessages = () => {
    setSuccess("");
    setError("");
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!accessControl) {
      setError("AccessControl contract is not available.");
      return;
    }

    try {
      setLoading(true);

      const tx = await accessControl.registerUser(
        registerAddress,
        Number(registerRole)
      );

      await tx.wait();

      setSuccess("User registered successfully.");
      setRegisterAddress("");
      setRegisterRole(1);
    } catch (err) {
      setError(err?.reason || err?.shortMessage || err?.message || "Failed to register user.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!accessControl) {
      setError("AccessControl contract is not available.");
      return;
    }

    try {
      setLoading(true);

      const tx = await accessControl.changeUserRole(
        changeRoleAddress,
        Number(newRole)
      );

      await tx.wait();

      setSuccess("User role changed successfully.");
      setChangeRoleAddress("");
      setNewRole(1);
    } catch (err) {
      setError(err?.reason || err?.shortMessage || err?.message || "Failed to change user role.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetUserActive = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!accessControl) {
      setError("AccessControl contract is not available.");
      return;
    }

    try {
      setLoading(true);

      const tx = await accessControl.setUserActive(
        statusAddress,
        statusValue
      );

      await tx.wait();

      setSuccess("User status updated successfully.");
      setStatusAddress("");
      setStatusValue(true);
    } catch (err) {
      setError(err?.reason || err?.shortMessage || err?.message || "Failed to update user status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Admin Dashboard</h1>
      <p>Manage users, roles, and activation status.</p>

      {success && (
        <div style={{ marginBottom: "16px", color: "green" }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: "16px", color: "red" }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: "32px", padding: "16px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Register User</h2>
        <form onSubmit={handleRegisterUser}>
          <div style={{ marginBottom: "12px" }}>
            <label>User Address</label>
            <br />
            <input
              type="text"
              value={registerAddress}
              onChange={(e) => setRegisterAddress(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", padding: "10px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Role</label>
            <br />
            <select
              value={registerRole}
              onChange={(e) => setRegisterRole(Number(e.target.value))}
              style={{ width: "100%", padding: "10px" }}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Register User"}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: "32px", padding: "16px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Change User Role</h2>
        <form onSubmit={handleChangeRole}>
          <div style={{ marginBottom: "12px" }}>
            <label>User Address</label>
            <br />
            <input
              type="text"
              value={changeRoleAddress}
              onChange={(e) => setChangeRoleAddress(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", padding: "10px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>New Role</label>
            <br />
            <select
              value={newRole}
              onChange={(e) => setNewRole(Number(e.target.value))}
              style={{ width: "100%", padding: "10px" }}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Change Role"}
          </button>
        </form>
      </section>

      <section style={{ padding: "16px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Set User Active</h2>
        <form onSubmit={handleSetUserActive}>
          <div style={{ marginBottom: "12px" }}>
            <label>User Address</label>
            <br />
            <input
              type="text"
              value={statusAddress}
              onChange={(e) => setStatusAddress(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", padding: "10px" }}
              required
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Status</label>
            <br />
            <select
              value={String(statusValue)}
              onChange={(e) => setStatusValue(e.target.value === "true")}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Update Status"}
          </button>
        </form>
      </section>
    </div>
  );
}