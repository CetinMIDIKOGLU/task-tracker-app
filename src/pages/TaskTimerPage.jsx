import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, set, get, push, remove, update } from "firebase/database";

export default function PersonTask() {
  const [persons, setPersons] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newTask, setNewTask] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const timersRef = useRef({});
  const navigate = useNavigate();

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const personsSnapshot = await get(ref(db, 'persons'));
        const tasksSnapshot = await get(ref(db, 'tasks'));
        const completedSnapshot = await get(ref(db, 'completedTasks'));

        if (personsSnapshot.exists()) {
          setPersons(personsSnapshot.val() || []);
        }
        if (tasksSnapshot.exists()) {
          setTasks(tasksSnapshot.val() || []);
        }
        if (completedSnapshot.exists()) {
          setCompletedTasks(completedSnapshot.val() || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  
  useEffect(() => {
    const saveData = async () => {
      try {
        await set(ref(db, 'persons'), persons);
        await set(ref(db, 'tasks'), tasks);
        await set(ref(db, 'completedTasks'), completedTasks);
      } catch (error) {
        console.error("Error saving data:", error);
      }
    };

    if (!loading) {
      saveData();
    }
  }, [persons, tasks, completedTasks, loading]);

  const handleAddPerson = () => {
    if (!firstName.trim() || !lastName.trim()) return;

    const person = {
      id: Date.now(),
      name: `${firstName.trim()} ${lastName.trim()}`,
    };

    setPersons([...persons, person]);
    setFirstName("");
    setLastName("");
    setShowPersonModal(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask.trim(),
    };

    setTasks([...tasks, task]);
    setNewTask("");
    setShowTaskModal(false);
  };

  const handleAssignPersonToTask = () => {
    if (!selectedPersonId || !selectedTaskId || !selectedDuration) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    const assignment = {
      id: Date.now(),
      personId: parseInt(selectedPersonId),
      taskId: parseInt(selectedTaskId),
      estimatedTime: selectedDuration,
      duration: 0,
      isRunning: false,
      status: "Beklemede",
      startTime: null,
      pausedDuration: 0,
    };

    setTasks((prev) => [...prev, assignment]);
    setShowAssignModal(false);
    setSelectedPersonId("");
    setSelectedTaskId("");
    setSelectedDuration("");
  };

  const startTimer = (id) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: true,
              status: "Devam Ediyor",
              startTime: now,
              pausedDuration: t.pausedDuration || 0,
            }
          : t
      )
    );

    timersRef.current[id] = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id && t.isRunning) {
            const activeDuration = (Date.now() - t.startTime) / 1000;
            return {
              ...t,
              duration: t.pausedDuration + activeDuration,
            };
          }
          return t;
        })
      );
    }, 1000);
  };

  const pauseTimer = (id) => {
    clearInterval(timersRef.current[id]);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const activeDuration = (Date.now() - t.startTime) / 1000;
          return {
            ...t,
            isRunning: false,
            status: "Duraklatıldı",
            pausedDuration: t.pausedDuration + activeDuration,
            startTime: null,
          };
        }
        return t;
      })
    );
  };

  const prepareCompleteTask = (id) => {
    setTaskToComplete(id);
    setShowConfirmModal(true);
  };

  const completeTask = () => {
    if (!taskToComplete) return;

    const id = taskToComplete;
    clearInterval(timersRef.current[id]);
    
    const finishedTask = tasks.find((t) => t.id === id);
    const person = persons.find((p) => p.id === finishedTask.personId);
    const originalTask = tasks.find((t) => t.id === finishedTask.taskId) || 
                        tasks.find((t) => t.taskId === finishedTask.taskId);
    const taskTitle = originalTask?.title || "";

    const record = {
      personName: person?.name,
      taskTitle,
      duration: finishedTask.duration,
      completedAt: new Date().toISOString(),
    };

    setCompletedTasks((prev) => [...prev, record]);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    
    setShowConfirmModal(false);
    setTaskToComplete(null);
  };

  const getTaskTitle = (taskId) => {
    const task = tasks.find((t) => t.id === taskId || t.taskId === taskId);
    return task?.title || "";
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="container mt-5">Yükleniyor...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h2 className="mb-0">👤 Kişi ve Görev Yönetimi</h2>
        <Link to="/takip" className="btn btn-outline-primary">
          ⏱️ Görev Takibi
        </Link>
      </div>

      <div className="mb-4 d-flex gap-3">
        <button className="btn btn-primary" onClick={() => setShowPersonModal(true)}>
          + Kişi Ekle
        </button>
        <button className="btn btn-success" onClick={() => setShowTaskModal(true)}>
          + Görev Ekle
        </button>
        <button className="btn btn-warning" onClick={handleAssignClick}>
          👥 Görev Ata
        </button>
      </div>

      {showPersonModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Yeni Kişi Ekle</h5>
                <button type="button" className="btn-close" onClick={() => setShowPersonModal(false)}></button>
              </div>
              <div className="modal-body">
                <input type="text" className="form-control mb-2" placeholder="Ad" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input type="text" className="form-control" placeholder="Soyad" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPersonModal(false)}>İptal</button>
                <button className="btn btn-primary" onClick={handleAddPerson}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Yeni Görev Ekle</h5>
                <button type="button" className="btn-close" onClick={() => setShowTaskModal(false)}></button>
              </div>
              <div className="modal-body">
                <input type="text" className="form-control mb-2" placeholder="Görev adı" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>İptal</button>
                <button className="btn btn-success" onClick={handleAddTask}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Kişiye Görev Ata</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <div className="modal-body">
                <select className="form-select mb-2" value={selectedPersonId} onChange={(e) => setSelectedPersonId(e.target.value)}>
                  <option value="">Kişi Seçiniz</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select className="form-select mb-2" value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}>
                  <option value="">Görev Seçiniz</option>
                  {tasks.filter(task => !task.taskId).map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>

                <input type="number" className="form-control" placeholder="Tahmini Süre (saat)" value={selectedDuration} onChange={(e) => setSelectedDuration(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>İptal</button>
                <button className="btn btn-primary" onClick={handleAssignPersonToTask}>Ata</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Görevi Tamamla</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Görevi tamamladığınıza emin misiniz?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>İptal</button>
                <button className="btn btn-danger" onClick={completeTask}>Tamamla</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h5 className="mt-5">Atanmış Görevler</h5>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Kişi</th>
            <th>Görev</th>
            <th>Tahmini Süre</th>
            <th>Geçen Süre</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {tasks.filter(t => t.taskId).map((task) => {
            const person = persons.find((p) => p.id === task.personId);
            const taskTitle = getTaskTitle(task.taskId);
            return (
              <tr key={task.id}>
                <td>{person?.name}</td>
                <td>{taskTitle}</td>
                <td>{task.estimatedTime} saat</td>
                <td>{formatDuration(task.duration)}</td>
                <td>
                  {task.isRunning ? (
                    <>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => pauseTimer(task.id)}>Duraklat</button>
                      <button className="btn btn-sm btn-danger" onClick={() => prepareCompleteTask(task.id)}>Bitir</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-success me-2" onClick={() => startTimer(task.id)}>Başlat</button>
                      <button className="btn btn-sm btn-danger" onClick={() => prepareCompleteTask(task.id)}>Bitir</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
