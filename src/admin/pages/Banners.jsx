import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { MdDelete, MdAddPhotoAlternate, MdEdit } from 'react-icons/md';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    const fetchBanners = async () => {
      const snap = await getDocs(collection(db, 'banners'));
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchBanners();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageUrl || !title || !description) return;
    setUploading(true);
    try {
      await addDoc(collection(db, 'banners'), { url: imageUrl, title, description });
      setImageUrl('');
      setTitle('');
      setDescription('');
      // Refresh banners
      const snap = await getDocs(collection(db, 'banners'));
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      alert('Failed to upload banner');
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    await deleteDoc(doc(db, 'banners', id));
    setBanners(banners.filter(b => b.id !== id));
  };

  const openEdit = (banner) => {
    setEditingBanner(banner);
    setEditImageUrl(banner.url);
    setEditTitle(banner.title);
    setEditDescription(banner.description);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingBanner) return;
    await updateDoc(doc(db, 'banners', editingBanner.id), {
      url: editImageUrl,
      title: editTitle,
      description: editDescription,
    });
    setEditingBanner(null);
    setEditImageUrl('');
    setEditTitle('');
    setEditDescription('');
    // Refresh banners
    const snap = await getDocs(collection(db, 'banners'));
    setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Banner Images</h1>
      <form onSubmit={handleUpload} className="flex flex-col gap-3 mb-8">
        <input
          type="url"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Paste image URL or base64 string"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          required
        />
        <input
          type="text"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Banner Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Banner Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <button
          type="submit"
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={uploading || !imageUrl || !title || !description}
        >
          <MdAddPhotoAlternate className="w-5 h-5" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="relative group rounded-lg overflow-hidden border shadow-sm bg-white">
            <img src={banner.url} alt="Banner" className="w-full h-40 object-cover" />
            {/* Vignette and text preview */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
              <div className="text-white text-lg font-bold drop-shadow mb-1">{banner.title}</div>
              <div className="text-white text-sm drop-shadow mb-2">{banner.description}</div>
            </div>
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 text-red-600 hover:bg-red-100 shadow transition"
              onClick={() => handleDelete(banner.id)}
              title="Delete"
            >
              <MdDelete className="w-5 h-5" />
            </button>
            <button
              className="absolute top-2 left-2 bg-white bg-opacity-80 rounded-full p-2 text-blue-600 hover:bg-blue-100 shadow transition"
              onClick={() => openEdit(banner)}
              title="Edit"
            >
              <MdEdit className="w-5 h-5" />
            </button>
          </div>
        ))}
        {banners.length === 0 && <div className="col-span-full text-gray-400 text-center">No banners uploaded yet.</div>}
      </div>
      {/* Edit Modal */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Edit Banner</h3>
            {/* Preview section */}
            <div className="relative h-40 w-full rounded-lg overflow-hidden mb-6 shadow border">
              <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <div className="text-lg font-bold drop-shadow mb-1">{editTitle}</div>
                <div className="text-sm drop-shadow mb-2">{editDescription}</div>
              </div>
            </div>
            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <input
                type="url"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Paste image URL or base64 string"
                value={editImageUrl}
                onChange={e => setEditImageUrl(e.target.value)}
                required
              />
              <input
                type="text"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Banner Title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
              />
              <input
                type="text"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Banner Description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                required
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  onClick={() => setEditingBanner(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners; 