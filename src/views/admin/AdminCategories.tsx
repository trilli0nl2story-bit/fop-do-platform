import { useState, useCallback } from 'react';
import { FolderOpen, GripVertical, Plus, Pencil, Trash2, Eye, EyeOff, X, Check } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  CmsCategory,
  getAllCategoriesWithCounts,
  saveCmsCategory,
  saveCmsCategories,
  deleteCmsCategory,
  createCategory,
  reorderCategories,
} from '../../lib/cmsCategories';

export function AdminCategories() {
  const [categories, setCategories] = useState<CmsCategory[]>(() => getAllCategoriesWithCounts());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const reload = useCallback(() => {
    setCategories(getAllCategoriesWithCounts());
  }, []);

  const persistReorder = (cats: CmsCategory[]) => {
    const reordered = reorderCategories(cats);
    saveCmsCategories(reordered);
    setCategories(reordered);
  };

  const startEdit = (cat: CmsCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = () => {
    if (!editName.trim() || editingId === null) return;
    const cat = categories.find(c => c.id === editingId);
    if (!cat) return;
    const updated = { ...cat, name: editName.trim() };
    saveCmsCategory(updated);
    reload();
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const cat = createCategory(newName.trim());
    saveCmsCategory(cat);
    reload();
    setNewName('');
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    deleteCmsCategory(id);
    setDeleteConfirm(null);
    reload();
  };

  const handleToggleVisible = (cat: CmsCategory) => {
    saveCmsCategory({ ...cat, isVisible: !cat.isVisible });
    reload();
  };

  const moveUp = (id: string) => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx <= 0) return;
    const newCats = [...categories];
    [newCats[idx - 1], newCats[idx]] = [newCats[idx], newCats[idx - 1]];
    persistReorder(newCats);
  };

  const moveDown = (id: string) => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx >= categories.length - 1) return;
    const newCats = [...categories];
    [newCats[idx], newCats[idx + 1]] = [newCats[idx + 1], newCats[idx]];
    persistReorder(newCats);
  };

  const visibleCount = categories.filter(c => c.isVisible).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Категории</h1>
          <p className="text-gray-600 text-sm">{visibleCount} из {categories.length} категорий видимы</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Создать
        </Button>
      </div>

      {showCreate && (
        <Card hover={false} className="mb-6 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Название новой категории"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1"
            />
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
              <Check className="w-4 h-4" />
              Добавить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowCreate(false); setNewName(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <Card hover={false}>
        <div className="space-y-1">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                !cat.isVisible ? 'opacity-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveUp(cat.id)}
                  disabled={idx === 0}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12"><path d="M6 3L2 7h8L6 3z" fill="currentColor" /></svg>
                </button>
                <button
                  onClick={() => moveDown(cat.id)}
                  disabled={idx === categories.length - 1}
                  className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12"><path d="M6 9L2 5h8L6 9z" fill="currentColor" /></svg>
                </button>
              </div>

              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className={`w-4 h-4 ${cat.isVisible ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>

              {editingId === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none flex-1"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                      {!cat.isVisible && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">скрыта</span>
                      )}
                      {cat.source === 'cms' && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">CMS</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{cat.docCount} документов</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleVisible(cat)}
                      title={cat.isVisible ? 'Скрыть категорию' : 'Показать категорию'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        cat.isVisible
                          ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                      }`}
                    >
                      {cat.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Переименовать"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {cat.source === 'cms' && (
                      deleteConfirm === cat.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Удалить
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(cat.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Удалить категорию"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Нет категорий. Создайте первую.</p>
          </div>
        )}
      </Card>
    </>
  );
}
