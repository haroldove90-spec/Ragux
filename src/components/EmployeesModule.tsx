import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Edit2,
  Trash2,
  Share2,
  Phone,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface EmployeesModuleProps {
  onRefresh: () => void;
}

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({ onRefresh }) => {
  const [employees, setEmployees] = useState<UserAccount[]>(() => StorageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [rol, setRol] = useState<UserRole>('vendedor');
  const [telefono, setTelefono] = useState('');
  const [activo, setActivo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);

  const refreshList = () => {
    setEmployees(StorageService.getUsers());
    onRefresh();
  };

  // Generate strong secure password generator
  const generateSecurePassword = () => {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghjkmnpqrstuvwxyz';
    const charsNumbers = '23456789';
    const charsSpecial = '!@#$%&*';

    let pass = '';
    // Ensure at least one of each
    pass += charsUpper[Math.floor(Math.random() * charsUpper.length)];
    pass += charsLower[Math.floor(Math.random() * charsLower.length)];
    pass += charsNumbers[Math.floor(Math.random() * charsNumbers.length)];
    pass += charsSpecial[Math.floor(Math.random() * charsSpecial.length)];

    const allChars = charsUpper + charsLower + charsNumbers + charsSpecial;
    for (let i = 0; i < 6; i++) {
      pass += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle
    const shuffled = pass
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
    setClave(shuffled);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setNombre('');
    setUsuario('');
    setClave('');
    setRol('vendedor');
    setTelefono('');
    setActivo(true);
    setShowPassword(true);
    generateSecurePassword();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: UserAccount) => {
    setEditingId(emp.id);
    setNombre(emp.nombre);
    setUsuario(emp.usuario);
    setClave(emp.clave);
    setRol(emp.rol);
    setTelefono(emp.telefono || '');
    setActivo(emp.activo);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !usuario.trim() || !clave.trim()) {
      alert('Por favor completa todos los campos requeridos (Nombre, Usuario y Contraseña).');
      return;
    }

    const newAccount: UserAccount = {
      id: editingId || `usr-${Date.now()}`,
      nombre: nombre.trim(),
      usuario: usuario.trim(),
      clave: clave.trim(),
      rol,
      telefono: telefono.trim(),
      activo,
      createdAt: editingId
        ? employees.find((e) => e.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    StorageService.saveUser(newAccount);
    refreshList();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, empName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el acceso de "${empName}"?`)) {
      StorageService.deleteUser(id);
      refreshList();
    }
  };

  // WhatsApp formatted message
  const createWhatsAppText = (emp: UserAccount): string => {
    const roleTitle =
      emp.rol === 'admin'
        ? 'Administrador'
        : emp.rol === 'vendedor'
        ? 'Ventas / Cotizador'
        : emp.rol === 'almacen'
        ? 'Almacén'
        : 'Empleado';

    return `¡Hola ${emp.nombre}! 👋
Te comparto tus credenciales de acceso para el sistema *ROGUX Distribuciones*:

🌐 *Enlace del Sistema:* https://ragux.vercel.app/
👤 *Usuario:* ${emp.usuario}
🔑 *Contraseña:* ${emp.clave}
🛡️ *Rol asignado:* ${roleTitle}

💡 Puedes abrir el enlace desde tu celular o computadora e instalar la aplicación. ¡Bienvenido al equipo!`;
  };

  const handleShareWhatsApp = (emp: UserAccount) => {
    const text = createWhatsAppText(emp);
    const cleanPhone = (emp.telefono || '').replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? '52' + cleanPhone : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyCredentials = (emp: UserAccount) => {
    const text = createWhatsAppText(emp);
    navigator.clipboard.writeText(text);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredEmployees = employees.filter((emp) => {
    const search = searchTerm.toLowerCase();
    return (
      emp.nombre.toLowerCase().includes(search) ||
      emp.usuario.toLowerCase().includes(search) ||
      emp.rol.toLowerCase().includes(search) ||
      (emp.telefono && emp.telefono.includes(search))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-[#66C34E] rounded-xl border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Módulo de Empleados y Accesos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Registra a tus colaboradores, genera contraseñas seguras y comparte sus credenciales con el link de la app por WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all cursor-pointer hover:brightness-105 active:scale-[0.99] shrink-0"
          style={{ backgroundColor: '#66C34E' }}
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Registrar Empleado</span>
        </button>
      </div>

      {/* Search and System Link Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar empleado por nombre, usuario o teléfono..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 outline-none shadow-xs"
          />
        </div>

        {/* System Link info card */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
              Enlace Oficial del Sistema
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-950 truncate block">
              https://ragux.vercel.app/
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('https://ragux.vercel.app/');
              setCopiedGeneral(true);
              setTimeout(() => setCopiedGeneral(false), 2000);
            }}
            className="p-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shrink-0"
            title="Copiar enlace"
          >
            {copiedGeneral ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Empleado / Nombre</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Contraseña</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No se encontraron empleados registrados.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{emp.nombre}</div>
                      {emp.usuario === 'haroldo90' && (
                        <span className="text-[10px] text-emerald-600 font-medium">Cuenta Comercial Clave</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-800">
                      {emp.usuario}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                        {emp.clave}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          emp.rol === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {emp.rol === 'admin' ? 'Administrador' : emp.rol === 'vendedor' ? 'Ventas' : emp.rol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">
                      {emp.telefono || 'Sin registrar'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          emp.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp share button */}
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(emp)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition text-xs font-bold cursor-pointer"
                          title="Enviar credenciales y link del sistema por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(emp)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition cursor-pointer"
                          title="Copiar credenciales completas"
                        >
                          {copiedId === emp.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Editar empleado"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete (prevent deleting admin_123) */}
                        {emp.usuario !== 'admin_123' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(emp.id, emp.nombre)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Eliminar empleado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Register / Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#66C34E]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingId ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Crea o actualiza credenciales para acceder a ROGUX
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Harold Anguiano Morales"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Usuario de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Ej. haroldo90"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Rol en el Sistema
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm outline-none bg-white"
                  >
                    <option value="vendedor">Ventas (Cotizador en ruta)</option>
                    <option value="almacen">Almacén (Inventario)</option>
                    <option value="admin">Administrador (Total)</option>
                    <option value="empleado">Empleado General</option>
                  </select>
                </div>
              </div>

              {/* Password field with Secure Password Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#66C34E]" />
                    Generar Contraseña Segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="Contraseña del empleado"
                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Teléfono WhatsApp (10 dígitos)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="4443053182"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="w-4 h-4 text-[#66C34E] rounded focus:ring-[#66C34E]"
                    />
                    <span className="text-xs font-semibold text-gray-800">Cuenta Activa</span>
                  </label>
                </div>
              </div>

              {/* Notice about sharing */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                Al guardar podrás enviar un mensaje instantáneo a su WhatsApp con el enlace oficial: <strong className="font-mono">https://ragux.vercel.app/</strong> junto con su usuario y contraseña.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105 cursor-pointer"
                  style={{ backgroundColor: '#66C34E' }}
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
