'use client'; // Menandakan ini adalah Client Component (Next.js dengan App Router)

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const quotes = [
  'Tetap semangat! Satu tugas lagi 💪',
  'Fokus itu kekuatan! 🔥',
  'Kamu hebat! Jangan menyerah 🌟',
  'Tugas kecil hari ini = sukses besar nanti 📈',
];

const getRandomQuote = () => {
  return quotes[Math.floor(Math.random() * quotes.length)];
};

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(getRandomQuote());
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;
    if (difference <= 0) return 'Waktu habis!';
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);

      Swal.fire({
        icon: 'success',
        title: 'Tugas ditambahkan!',
        text: 'Semangat menyelesaikannya 💪',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    const toggledTask = updatedTasks.find((task) => task.id === id);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, { completed: toggledTask?.completed });

    if (toggledTask?.completed) {
      const sound = new Howl({ src: ['/success.mp3'] });
      sound.play();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      Swal.fire({
        icon: 'success',
        title: 'Kerja bagus! 🎉',
        text: getRandomQuote(),
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: 'Tugas ini akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e3342f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(tasks.filter((task) => task.id !== id));

      Swal.fire({
        icon: 'success',
        title: 'Terhapus!',
        text: 'Tugas telah berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const editTask = async (id: string): Promise<void> => {
    const taskToEdit = tasks.find((task) => task.id === id);
    if (!taskToEdit) return;

    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${taskToEdit.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${taskToEdit.deadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = {
        ...taskToEdit,
        text: formValues[0],
        deadline: formValues[1],
      };

      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      const newTasks = tasks.map((task) =>
        task.id === id ? updatedTask : task
      );
      setTasks(newTasks);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 transition-all duration-300">
      <div className="max-w-lg mx-auto mt-10 p-6 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-500">📝 To-Do List</h1>
        </div>

        {/* Kutipan motivasi */}
        <p className="text-sm text-center italic text-gray-600 mb-4">💡 {quote}</p>

        {/* Tombol tambah tugas */}
        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white px-6 py-2 rounded-full shadow-md transition-all duration-300"
          >
            ➕ Tambah Tugas
          </button>
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>✅ {tasks.filter(t => t.completed).length} dari {tasks.length} tugas selesai</span>
              <span>{Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Daftar tugas */}
        <ul>
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = calculateTimeRemaining(task.deadline);
              const isExpired = timeLeft === 'Waktu habis!';
              const taskColor = task.completed
                ? 'bg-green-100'
                : isExpired
                ? 'bg-red-100'
                : 'bg-yellow-100';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 mb-4 rounded-2xl shadow-md ${taskColor} transition-transform transform hover:scale-[1.02]`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`${
                        task.completed
                          ? 'line-through text-gray-500'
                          : 'font-semibold text-gray-800'
                      }`}
                    >
                      {task.text}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-white px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-sm"
                      >
                        ✔️ Selesai
                      </button>
                      <button
                        onClick={() => editTask(task.id)}
                        className="text-white px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-white px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    📅 Deadline: {new Date(task.deadline).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-gray-700">
                    ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
