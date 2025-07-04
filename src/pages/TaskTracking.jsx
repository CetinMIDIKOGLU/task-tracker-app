// src/pages/TaskTracking.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFirebaseData } from '../hooks/useFirebaseData';

function TaskTracking() {
  const { data: { completedTasks }, loading, updateData } = useFirebaseData();

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRemoveCompleted = (index) => {
    const confirmDelete = window.confirm("Bu tamamlanan görevi silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    const updated = [...completedTasks];
    updated.splice(index, 1);
    updateData({ completedTasks: updated });
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="container mt-5">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h2 className="mb-0">⏱️ Görev Takibi</h2>
        <Link to="/" className="btn btn-outline-secondary">
          Geri Dön
        </Link>
      </div>

      <h5 className="mt-5">Tamamlanan Görevler</h5>
      {completedTasks.length === 0 ? (
        <p>Henüz tamamlanmış görev bulunmamaktadır.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th style={{ width: "200px" }}>Kişi</th>
              <th style={{ width: "200px" }}>Görev</th>
              <th style={{ width: "150px" }}>Tahmini Süre</th>
              <th style={{ width: "150px" }}>Harcanan Süre</th>
              <th style={{ width: "200px" }}>Tamamlanma Zamanı</th>
              <th style={{ width: "100px" }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {completedTasks.map((task, index) => (
              <tr key={index}>
                <td>{task.personName}</td>
                <td>{task.taskTitle}</td>
                <td>{task.estimatedTime} saat</td>
                <td>{formatDuration(task.duration)}</td>
                <td>{new Date(task.completedAt).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveCompleted(index)}
                  >
                    Kaldır
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TaskTracking;
