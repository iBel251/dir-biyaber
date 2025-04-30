import React, { useState, useEffect } from 'react';
import UploadFormModal from './UploadFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditFormModal from './EditFormModal';
import { addForm, fetchForms, removeForm, editForm } from '../../../firebase/firebaseAdminServices';

const FormsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nameAm: '',
    nameEn: '',
    file: null as File | null,
    description: '',
  });
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; formId: string | null; formName: string }>({
    open: false,
    formId: null,
    formName: '',
  });
  const [editModal, setEditModal] = useState<{ open: boolean; formId: string | null; initialValues: { nameAm: string; nameEn: string; description: string } }>({
    open: false,
    formId: null,
    initialValues: { nameAm: '', nameEn: '', description: '' },
  });

  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await fetchForms();
      setForms(data);
    } catch (e) {
      setForms([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleUpload = async (form: typeof formData) => {
    try {
      if (!form.file) throw new Error('No file selected');
      await addForm({
        nameAm: form.nameAm,
        nameEn: form.nameEn,
        file: form.file,
        description: form.description,
      });
      alert('Form uploaded!');
      setShowModal(false);
      setFormData({ nameAm: '', nameEn: '', file: null, description: '' });
      await loadForms(); // Refetch forms after upload
    } catch (error: any) {
      alert(error.message || 'Failed to upload form.');
    }
  };

  const handleDelete = async (formId: string) => {
    try {
      await removeForm(formId);
      await loadForms();
    } catch (error: any) {
      alert(error.message || 'Failed to delete form.');
    }
    setDeleteModal({ open: false, formId: null, formName: '' });
  };

  const handleEdit = async (formId: string, fields: { nameAm: string; nameEn: string; description: string }) => {
    try {
      await editForm(formId, fields);
      await loadForms();
      setEditModal({ open: false, formId: null, initialValues: { nameAm: '', nameEn: '', description: '' } });
    } catch (error: any) {
      alert(error.message || 'Failed to edit form.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Forms Management</h1>
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          onClick={() => setShowModal(true)}
        >
          Upload Form
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-8 max-w-xl mx-auto">
        {loading ? (
          <p className="text-gray-500 text-center">Loading forms...</p>
        ) : forms.length === 0 ? (
          <p className="text-gray-500 text-center">No forms available for management at this time.</p>
        ) : (
          <ul className="space-y-4">
            {forms.map((form) => (
              <li key={form.id} className="border rounded p-4 flex flex-col gap-2">
                <div className="font-semibold">{form.nameEn} <span className="text-gray-500">({form.nameAm})</span></div>
                <div className="text-sm text-gray-600">{form.description}</div>
                <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Download</a>
                <div className="text-xs text-gray-400">Uploaded: {form.createdAt ? new Date(form.createdAt).toLocaleString() : ''}</div>
                <div className="flex justify-end gap-2">
                  <button
                    className="self-end mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs mr-2"
                    onClick={() => setEditModal({ open: true, formId: form.id, initialValues: { nameAm: form.nameAm, nameEn: form.nameEn, description: form.description } })}
                  >
                    Edit
                  </button>
                  <button
                    className="self-end mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                    onClick={() => setDeleteModal({ open: true, formId: form.id, formName: form.nameEn })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <UploadFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onUpload={handleUpload}
        formData={formData}
        setFormData={setFormData}
      />
      {deleteModal.open && (
        <DeleteConfirmationModal
          itemName={`form "${deleteModal.formName}"`}
          onCancel={() => setDeleteModal({ open: false, formId: null, formName: '' })}
          onConfirm={async () => {
            if (deleteModal.formId) await handleDelete(deleteModal.formId);
          }}
        />
      )}
      <EditFormModal
        show={editModal.open}
        onClose={() => setEditModal({ open: false, formId: null, initialValues: { nameAm: '', nameEn: '', description: '' } })}
        onSave={async (fields) => {
          if (editModal.formId) await handleEdit(editModal.formId, fields);
        }}
        initialValues={editModal.initialValues}
      />
    </div>
  );
};

export default FormsPage;
