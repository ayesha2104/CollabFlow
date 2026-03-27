import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // ES6
import { Plus, Trash2, Save, FileText } from 'lucide-react';

const DocsView = ({ project, onUpdateProject }) => {
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    
    // Fallback if project is undefined
    const documents = project?.documents || [];
    const activeDoc = documents[selectedDocIndex] || null;

    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');

    const handleCreateDoc = () => {
        const newDoc = { title: 'Untitled Document', content: '' };
        const newDocs = [...documents, newDoc];
        onUpdateProject({ documents: newDocs });
        setSelectedDocIndex(newDocs.length - 1);
        setIsEditing(true);
        setEditTitle('Untitled Document');
        setEditContent('');
    };

    const handleStartEdit = () => {
        if (!activeDoc) return;
        setEditTitle(activeDoc.title);
        setEditContent(activeDoc.content || '');
        setIsEditing(true);
    };

    const handleSaveDoc = () => {
        if (!activeDoc) return;
        const newDocs = [...documents];
        newDocs[selectedDocIndex] = {
            ...activeDoc,
            title: editTitle.trim() || 'Untitled Document',
            content: editContent
        };
        onUpdateProject({ documents: newDocs });
        setIsEditing(false);
    };

    const handleDeleteDoc = (index) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        const newDocs = documents.filter((_, i) => i !== index);
        onUpdateProject({ documents: newDocs });
        if (selectedDocIndex >= newDocs.length) setSelectedDocIndex(Math.max(0, newDocs.length - 1));
        setIsEditing(false);
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="flex h-[calc(100vh-250px)] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-64 border-r border-slate-800 bg-slate-800/30 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                        <FileText size={16} className="text-blue-400" />
                        Project Wiki
                    </h3>
                    <button 
                        onClick={handleCreateDoc}
                        className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-colors"
                        title="New Document"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {documents.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center italic mt-4">No documents yet.</div>
                    ) : (
                        documents.map((doc, idx) => (
                            <button
                                key={doc._id || idx}
                                onClick={() => {
                                    if (isEditing) handleSaveDoc();
                                    setSelectedDocIndex(idx);
                                    setIsEditing(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${
                                    selectedDocIndex === idx 
                                    ? 'bg-blue-500/20 text-blue-400 font-medium' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                <span className="truncate pr-2">{doc.title || 'Untitled Document'}</span>
                                <Trash2 
                                    size={14} 
                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDoc(idx);
                                    }}
                                />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-slate-900/50">
                {activeDoc ? (
                    isEditing ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                                <input 
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="bg-transparent text-xl font-bold text-white border-none focus:ring-0 px-0 w-1/2"
                                    placeholder="Document Title"
                                    autoFocus
                                />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveDoc}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        <Save size={16} /> Save Document
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-white document-editor-wrapper text-slate-900">
                                <ReactQuill 
                                    theme="snow" 
                                    value={editContent} 
                                    onChange={setEditContent} 
                                    modules={modules}
                                    className="h-full border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[500px]"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">{activeDoc.title}</h2>
                                <button 
                                    onClick={handleStartEdit}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                                >
                                    Edit Document
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/30">
                                <div 
                                    className="prose prose-invert prose-blue max-w-4xl"
                                    dangerouslySetInnerHTML={{ __html: activeDoc.content || '<p class="text-slate-500 italic">Empty document.</p>' }}
                                />
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Select a document or create a new one to get started.</p>
                        <button 
                            onClick={handleCreateDoc}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors font-medium text-sm"
                        >
                            <Plus size={16} /> Create First Document
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                .document-editor-wrapper .quill {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .document-editor-wrapper .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    background: #f8fafc;
                    padding: 12px;
                }
                .document-editor-wrapper .ql-container {
                    border: none !important;
                    flex: 1;
                    height: auto;
                }
                .document-editor-wrapper .ql-editor {
                    padding: 2rem;
                    font-size: 15px;
                    line-height: 1.6;
                }
            `}</style>
        </div>
    );
};

export default DocsView;
