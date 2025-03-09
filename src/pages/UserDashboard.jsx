import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, query, where, doc } from "firebase/firestore";
import { auth } from "../firebaseConfig";
import { Timestamp } from "firebase/firestore";
import "../styles/UserDashboard.css"; // Import the CSS file

const UserDashboard = () => {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]); // Store booked appointments
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState(""); // State for popup message

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "services"));
      setServices(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchAppointments = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, "appointments"), where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      setAppointments(
        querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
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

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return alert("Please fill all fields!");

    const selectedServiceDetails = services.find(service => service.name === selectedService);
    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const appointmentEndTime = new Date(appointmentDateTime.getTime() + selectedServiceDetails.duration * 60000);

    // Check for overlapping appointments
    const overlappingAppointments = appointments.filter(appointment => {
      const appointmentStart = appointment.date;
      const appointmentEnd = new Date(appointmentStart.getTime() + selectedServiceDetails.duration * 60000);
      return (appointmentDateTime < appointmentEnd && appointmentEndTime > appointmentStart);
    });

    if (overlappingAppointments.length > 0) {
      return alert("This time slot is already booked. Please choose another time.");
    }

    await addDoc(collection(db, "appointments"), {
      userId: auth.currentUser.uid,
      service: selectedService,
      date: Timestamp.fromDate(appointmentDateTime),
      status: "booked",
    });

    setMessage("Appointment Booked!");
    setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds

    // Clear the input fields
    setSelectedService("");
    setSelectedDate("");
    setSelectedTime("");

    // Refresh the list of appointments
    const q = query(collection(db, "appointments"), where("userId", "==", auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    setAppointments(
      querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          service: data.service,
          date: data.date.toDate(), // Convert Firestore Timestamp to JavaScript Date
          status: data.status,
        };
      })
    );
  };

  const handleCancelAppointment = async (id) => {
    await deleteDoc(doc(db, "appointments", id));
    setMessage("Appointment Canceled!");
    setTimeout(() => setMessage(""), 3000); // Hide message after 3 seconds

    // Refresh the list of appointments
    const q = query(collection(db, "appointments"), where("userId", "==", auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    setAppointments(
      querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          service: data.service,
          date: data.date.toDate(), // Convert Firestore Timestamp to JavaScript Date
          status: data.status,
        };
      })
    );
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="dashboard-container">
      {message && <div className="popup-message">{message}</div>}
      <div className="top-bar">
        <img src="/logo.jpg" alt="Mr.Cut Logo" className="logo" />
        <h1 className="shop-name">Mr.Cut</h1>
      </div>
      <div className="content">
        <div className="left-container">
          <h2 className="title">Book an Appointment</h2>
          <div className="form-container">
            <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="input-field">
              <option value="">Select Service</option>
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name} - ${service.price}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
              min={today} // Set the minimum date to today
            />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="input-field"
            />
            <button onClick={handleBookAppointment} className="submit-button">
              Book
            </button>
          </div>
        </div>
        <div className="right-container">
          <h2 className="title">Your Appointments</h2>
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
                  <button onClick={() => handleCancelAppointment(appointment.id)} className="cancel-button">
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;