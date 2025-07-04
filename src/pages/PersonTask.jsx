import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFirebaseData } from '../hooks/useFirebaseData';

export default function PersonTask() {
  const { data, loading, updateData } = useFirebaseData();
  const { persons, tasks, completedTasks } = data;
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newTask, setNewTask] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");

  const timersRef = useRef({});
  const navigate = useNavigate();

  const handleChangePerson = (taskId, newPersonId) => {
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, personId: newPersonId } : t
    );
    updateData({ tasks: updatedTasks });
  };

  const handleChangeTask = (taskId, newTaskId) => {
    const selectedTask = tasks.find(t => t.id === newTaskId);
    if (!selectedTask) return;

    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? {
            ...t,
            taskId: newTaskId,
            title: selectedTask.title  
          }
        : t
    );

    updateData({ tasks: updatedTasks });
  };
  const handleDeletePerson = (id) => {
     const confirmDelete = window.confirm("Bu kişiyi silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;
    const updatedPersons = persons.filter(p => p.id !== id);
    updateData({ persons: updatedPersons });
    const isPersonInActiveTask = tasks.some(t => t.personId === id && t.isRunning);
    if (isPersonInActiveTask) {
      alert("Bu kişiye ait devam eden bir görev var. Önce görevi duraklat ya da tamamla.");
      return;
}
  };

  const handleDeleteTask = (id) => {
    const confirmDelete = window.confirm("Bu görevi silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;
    const updatedTasks = tasks.filter(t => t.id !== id);
    updateData({ tasks: updatedTasks });
    const isTaskRunning = tasks.some(t => t.id === id && t.isRunning);
    if (isTaskRunning) {
      alert("Bu görev şu anda çalışıyor. Lütfen önce duraklat veya tamamla.");
      return;
    }
  };

  const handleAddPerson = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    const confirmAdd = window.confirm("Bu kişiyi eklemek istediğinize emin misiniz?");
    if (!confirmAdd) return;

    const person = {
      id: Date.now(),
      name: `${firstName.trim()} ${lastName.trim()}`,
    };

    updateData({
      persons: [...persons, person]
    });
    setFirstName("");
    setLastName("");
    setShowPersonModal(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const confirmAdd = window.confirm("Bu görevi eklemek istediğinize emin misiniz?");
    if (!confirmAdd) return;

    const task = {
      id: Date.now(),
      title: newTask.trim(),
    };

    updateData({
      tasks: [...tasks, task]
    });
    setNewTask("");
    setShowTaskModal(false);
  };

  const handleAssignPersonToTask = () => {
    if (!selectedPersonId || !selectedTaskId || !selectedDuration) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    const selectedTask = tasks.find(t => t.id === parseInt(selectedTaskId));
    if (!selectedTask) {
      alert("Seçilen görev bulunamadı.");
      return;
    }

    const assignment = {
      id: Date.now(),
      personId: parseInt(selectedPersonId),
      taskId: parseInt(selectedTaskId),
      title: selectedTask.title, 
      estimatedTime: selectedDuration,
      duration: 0,
      isRunning: false,
      status: "Beklemede",
      startTime: null,
      pausedDuration: 0,
    };

    updateData({
      tasks: [...tasks, assignment]
    });

    setShowAssignModal(false);
    setSelectedPersonId("");
    setSelectedTaskId("");
    setSelectedDuration("");
  };

  const startTimer = (id) => {
    const now = Date.now();
    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            isRunning: true,
            status: "Devam Ediyor",
            startTime: now,
            pausedDuration: t.pausedDuration || 0,
          }
        : t
    );

    updateData({ tasks: updatedTasks });

    timersRef.current[id] = setInterval(() => {
    
      const currentTask = updatedTasks.find((t) => t.id === id);
      if (!currentTask || !currentTask.isRunning) return;

      const activeDuration = (Date.now() - currentTask.startTime) / 1000;

      const newTasks = updatedTasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            duration: t.pausedDuration + activeDuration,
          };
        }
        return t;
      });

      updateData({ tasks: newTasks });
    }, 1000);
  };

  const pauseTimer = (id) => {
    clearInterval(timersRef.current[id]);
    const updatedTasks = tasks.map((t) => {
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
    });

    updateData({ tasks: updatedTasks });
  };

  const prepareCompleteTask = (id) => {
    setTaskToComplete(id);
    setShowConfirmModal(true);
  };

  const completeTask = () => {
    if (!taskToComplete) return;

    const id = taskToComplete;
    clearInterval(timersRef.current[id]);

    const latestTasks = data.tasks;
    const latestPersons = data.persons;

    const finishedTask = latestTasks.find((t) => t.id === id);
    if (!finishedTask) return;

    const person = latestPersons.find((p) => p.id === finishedTask.personId);

   
    let taskTitle = "";
    if (finishedTask.title) {
      taskTitle = finishedTask.title;
    } else if (finishedTask.taskId) {
      const foundTask = latestTasks.find((t) => t.id === finishedTask.taskId);
      taskTitle = foundTask?.title || "";
    }

    const record = {
      personName: person?.name || "Bilinmiyor",
      taskTitle: taskTitle || "Görev Bilinmiyor",
      duration: finishedTask.duration,
      completedAt: new Date().toISOString(),
      estimatedTime: finishedTask.estimatedTime
    };

    const updatedCompleted = Array.isArray(data.completedTasks)
      ? [...data.completedTasks, record]
      : [record];

    const updatedTasks = latestTasks.filter((t) => t.id !== id);

    updateData({
      tasks: updatedTasks,
      completedTasks: updatedCompleted
    });

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

  if (loading) return <div className="container mt-5">Yükleniyor...</div>;

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
        <button className="btn btn-warning" onClick={() => setShowAssignModal(true)}>
          👥 Görev Ata
        </button>
        <button className="btn btn-outline-secondary" onClick={() => setShowEditModal(true)}>
          🔧 Düzenle
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
                  {tasks.filter(task => !task.personId).map((task) => (
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
            <th style={{ width: "200px" }}>Kişi</th>
            <th style={{ width: "200px" }}>Görev</th>
            <th style={{ width: "150px" }}>Tahmini Süre</th>
            <th style={{ width: "150px" }}>Geçen Süre</th>
            <th style={{ width: "150px" }}>Durum</th>
            <th style={{ width: "150px" }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {tasks.filter(t => t.personId).map((task) => {
            const person = persons.find((p) => p.id === task.personId);
            const taskTitle = getTaskTitle(task.taskId);
            return (
              <tr key={task.id}>
                <td>
                  {task.isRunning ? (
                    person?.name || "Bilinmiyor"
                  ) : (
                    <select
                      value={task.personId}
                      className="form-select form-select-sm"
                      onChange={(e) => handleChangePerson(task.id, parseInt(e.target.value))}
                    >
                      {persons.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  {task.isRunning ? (
                    taskTitle
                  ) : (
                    <select
                      value={task.taskId}
                      className="form-select form-select-sm"
                      onChange={(e) => handleChangeTask(task.id, parseInt(e.target.value))}
                    >
                      {tasks.filter(t => !t.personId).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td>{task.estimatedTime} saat</td>
                <td>{formatDuration(task.duration)}</td>
                <td>{task.status}</td>
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
      {showEditModal && (
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Düzenleme Paneli</h5>
                  <button type="button" className="btn-close" onClick={() => {
                    setShowEditModal(false);
                    setActiveEditSection(null);
                    setSearchTerm("");
                  }}></button>
                </div>
                <div className="modal-body">

                  <div className="d-flex gap-3 mb-3">
                    <button className="btn btn-outline-danger" onClick={() => {
                      setActiveEditSection("person");
                      setSearchTerm("");
                    }}>
                      👤 Kişi Kaldır
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => {
                      setActiveEditSection("task");
                      setSearchTerm("");
                    }}>
                      📋 Görev Kaldır
                    </button>
                  </div>

                  {activeEditSection && (
                    <>
                      <input
                        type="text"
                        className="form-control mb-3"
                        placeholder={activeEditSection === "person" ? "Kişi ara..." : "Görev ara..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />

                      <ul className="list-group">
                        {activeEditSection === "person" &&
                          persons
                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(p => (
                              <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {p.name}
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeletePerson(p.id)}>Sil</button>
                              </li>
                            ))
                        }

                        {activeEditSection === "task" &&
                          tasks
                            .filter(t => !t.personId && t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map(t => (
                              <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {t.title}
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTask(t.id)}>Sil</button>
                              </li>
                            ))
                        }
                      </ul>
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => {
                    setShowEditModal(false);
                    setActiveEditSection(null);
                    setSearchTerm("");
                  }}>
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
