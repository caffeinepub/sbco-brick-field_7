import { ArrowLeft, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

export interface LocalVehicle {
  id: string;
  vehicleNumber: string;
  createdAt: string;
}

const VEHICLES_KEY = "sbco_vehicles";

export function getLocalVehicles(): LocalVehicle[] {
  try {
    return JSON.parse(localStorage.getItem(VEHICLES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveVehicles(vehicles: LocalVehicle[]) {
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      data-ocid="add_vehicle.dialog"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1.25rem",
          padding: "1.75rem 1.5rem",
          width: "100%",
          maxWidth: "320px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            backgroundColor: "#fdecea",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <Trash2 size={20} color="#c62828" />
        </div>
        <h3
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "#212121",
            margin: "0 0 0.5rem",
            textAlign: "center",
          }}
        >
          Delete Confirmation
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#757575",
            margin: "0 0 1.5rem",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to delete this? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            data-ocid="add_vehicle.delete_dialog.cancel_button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1.5px solid #e0e0e0",
              borderRadius: "0.75rem",
              backgroundColor: "#ffffff",
              color: "#424242",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="add_vehicle.delete_dialog.confirm_button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "none",
              borderRadius: "0.75rem",
              backgroundColor: "#c62828",
              color: "#ffffff",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddVehiclePage({ onBack }: Props) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicles, setVehicles] = useState<LocalVehicle[]>(getLocalVehicles);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const inputStyle = {
    border: "1.5px solid #a5d6a7",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    color: "#424242",
    backgroundColor: "#ffffff",
    width: "100%",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#424242",
    marginBottom: "0.4rem",
    display: "block",
  };
  const sectionLabelStyle = {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#2e7d32",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    marginBottom: "1rem",
  };
  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    padding: "1.25rem 1rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.875rem",
  };

  function handleSave() {
    const trimmed = vehicleNumber.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a vehicle number");
      return;
    }
    const existing = getLocalVehicles();
    const duplicate = existing.find(
      (v) => v.vehicleNumber.toUpperCase() === trimmed,
    );
    if (duplicate) {
      toast.error("This vehicle number already exists");
      return;
    }
    const newVehicle: LocalVehicle = {
      id: `VH-${Date.now()}`,
      vehicleNumber: trimmed,
      createdAt: new Date().toLocaleString("en-IN"),
    };
    const updated = [newVehicle, ...existing];
    saveVehicles(updated);
    setVehicles(updated);
    setVehicleNumber("");
    toast.success(`Vehicle ${trimmed} added!`);
  }

  function requestDelete(id: string) {
    setDeleteConfirmId(id);
  }

  function confirmDelete() {
    if (!deleteConfirmId) return;
    const updated = getLocalVehicles().filter((v) => v.id !== deleteConfirmId);
    saveVehicles(updated);
    setVehicles(updated);
    setDeleteConfirmId(null);
    toast.success("Vehicle removed");
  }

  function cancelDelete() {
    setDeleteConfirmId(null);
  }

  return (
    <div
      style={{
        backgroundColor: "#eef5ee",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Bricolage Grotesque', sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      <header
        style={{
          backgroundColor: "#ffffff",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="add_vehicle.back.button"
          onClick={onBack}
          style={{
            backgroundColor: "#e8f5e9",
            border: "none",
            borderRadius: "50%",
            width: "2.25rem",
            height: "2.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="#1b5e20" />
        </button>
        <h2
          style={{
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "#1b5e20",
            margin: 0,
          }}
        >
          Add Vehicle
        </h2>
      </header>

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Input Card */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Vehicle Information</p>

          <div>
            <label htmlFor="vehicle-number" style={labelStyle}>
              Vehicle Number
            </label>
            <input
              id="vehicle-number"
              data-ocid="add_vehicle.vehicle_number.input"
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. WB-01-AB-1234"
              style={inputStyle}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            data-ocid="add_vehicle.save_vehicle.button"
            onClick={handleSave}
            style={{
              backgroundColor: "#2e7d32",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.875rem",
              padding: "1rem",
              width: "100%",
              fontWeight: 800,
              fontSize: "1rem",
              letterSpacing: "0.03em",
              cursor: "pointer",
            }}
          >
            Save Vehicle
          </button>
        </div>

        {/* Vehicle List */}
        {vehicles.length > 0 && (
          <div style={cardStyle}>
            <p style={sectionLabelStyle}>Saved Vehicles ({vehicles.length})</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {vehicles.map((v, i) => (
                <div
                  key={v.id}
                  data-ocid={`add_vehicle.vehicle_list.item.${i + 1}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f1f8e9",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#e8f5e9",
                        borderRadius: "50%",
                        width: "2rem",
                        height: "2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Truck size={14} color="#2e7d32" />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          color: "#1b5e20",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {v.vehicleNumber}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.68rem",
                          color: "#9e9e9e",
                        }}
                      >
                        {v.createdAt}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid={`add_vehicle.delete_vehicle.button.${i + 1}`}
                    onClick={() => requestDelete(v.id)}
                    style={{
                      backgroundColor: "#ffebee",
                      border: "none",
                      borderRadius: "0.5rem",
                      padding: "0.4rem 0.7rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#c62828",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}
