import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import "../styles/OwnerDashboard.css"; // Import the CSS file

const OwnerDashboard = () => {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]); // Store booked appointments
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });
  const [message, setMessage] = useState(""); // State for popup message

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "services"));
      setServices(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchAppointments = async () => {
      const querySnapshot = await getDocs(collection(db, "appointments"));
      setAppointments(
        querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            service: data.service,
            date: data.date.toDate(), // Convert Firestore Timestamp to JavaScript Date
            status: data.status,
          };
        })
      );
    };

    fetchServices();
    fetchAppointments();
  }, []);

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !newService.duration) return;
    const docRef = await addDoc(collection(db, "services"), {
      name: newService.name,
      price: Number(newService.price),
      duration: Number(newService.duration), // Duration in minutes
    });
    setServices([...services, { id: docRef.id, name: newService.name, price: Number(newService.price), duration: Number(newService.duration) }]);
    setMessage("Service Added!");
    setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds
  };

  const handleDeleteService = async (id) => {
    await deleteDoc(doc(db, "services", id));
    setServices(services.filter(service => service.id !== id));
    setMessage("Service Deleted!");
    setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds
  };

  const handleCancelAppointment = async (id) => {
    await deleteDoc(doc(db, "appointments", id));
    setMessage("Appointment Canceled!");
    setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds

    // Refresh the list of appointments
    const querySnapshot = await getDocs(collection(db, "appointments"));
    setAppointments(
      querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          service: data.service,
          date: data.date.toDate(), // Convert Firestore Timestamp to JavaScript Date
          status: data.status,
        };
      })
    );
  };

  return (
    <div className="owner-dashboard-container">
      {message && <div className="popup-message">{message}</div>}
      <h2 className="title">Manage Services</h2>
      <div className="form-container">
        <input
          type="text"
          placeholder="Service Name"
          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
          className="input-field"
        />
        <input
          type="number"
          placeholder="Price"
          onChange={(e) => setNewService({ ...newService, price: e.target.value })}
          className="input-field"
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
          className="input-field"
        />
        <button onClick={handleAddService} className="submit-button">
          Add
        </button>
      </div>
      <ul className="services-list">
        {services.map((service) => (
          <li key={service.id} className="service-item">
            {service.name} - ${service.price} - {service.duration} mins
            <button onClick={() => handleDeleteService(service.id)} className="delete-button">
              Delete
            </button>
          </li>
        ))}
      </ul>

      <h2 className="title">Booked Appointments</h2>
      <div className="appointments-container">
        {appointments.length === 0 ? (
          <p className="no-appointments">No appointments booked yet.</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <h3 className="appointment-service">{appointment.service}</h3>
              <p className="appointment-date">Date: {appointment.date.toLocaleDateString()}</p>
              <p className="appointment-time">Time: {appointment.date.toLocaleTimeString()}</p>
              <p className="appointment-status">Status: {appointment.status}</p>
              <p className="appointment-user">User ID: {appointment.userId}</p>
              <button onClick={() => handleCancelAppointment(appointment.id)} className="cancel-button">
                Cancel
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;