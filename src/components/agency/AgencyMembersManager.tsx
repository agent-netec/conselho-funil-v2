'use client';

import { useState, useEffect } from 'react';
import { getAgencyMembers, createAgencyInvite, getAgencyClients } from '@/lib/agency/engine';
import type { AgencyMember, AgencyClient, AgencyRole } from '@/types/agency';

interface Props {
  agencyId: string;
  currentUserId: string;
}

export function AgencyMembersManager({ agencyId, currentUserId }: Props) {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AgencyRole>('viewer');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [membersData, clientsData] = await Promise.all([
          getAgencyMembers(agencyId),
          getAgencyClients(agencyId)
        ]);
        setMembers(membersData);
        setClients(clientsData);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [agencyId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await createAgencyInvite(agencyId, currentUserId, {
        email: inviteEmail,
        role: inviteRole,
        assignedClients: inviteRole === 'manager' ? selectedClients : []
      });
      setGeneratedToken(token);
      // Aqui poderíamos disparar um e-mail real via Cloud Function
    } catch (error) {
      alert('Erro ao gerar convite');
    }
  };

  if (loading) return <div>Carregando membros...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestão de Equipe</h2>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Convidar Membro
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Papel</th>
              <th className="px-4 py-2 text-left">Clientes</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId} className="border-b">
                <td className="px-4 py-2">{member.userId}</td>
                <td className="px-4 py-2 capitalize">{member.role}</td>
                <td className="px-4 py-2">
                  {member.role === 'admin' ? 'Todos' : member.assignedClients?.length || 0}
                </td>
                <td className="px-4 py-2">
                  <button className="text-red-600 hover:underline">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Novo Convite</h3>
            {!generatedToken ? (
              <form onSubmit={handleSendInvite}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border rounded p-2"
                    placeholder="exemplo@agencia.com"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Papel</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AgencyRole)}
                    className="w-full border rounded p-2"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {inviteRole === 'manager' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Clientes Designados</label>
                    <div className="max-h-32 overflow-y-auto border rounded p-2">
                      {clients.map(client => (
                        <label key={client.id} className="flex items-center mb-1">
                          <input 
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedClients([...selectedClients, client.id]);
                              else setSelectedClients(selectedClients.filter(id => id !== client.id));
                            }}
                            className="mr-2"
                          />
                          {client.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Gerar Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-green-600 font-medium">Convite gerado com sucesso!</p>
                <div className="bg-gray-100 p-3 rounded break-all text-sm mb-4">
                  {`${window.location.origin}/invite?token=${generatedToken}&agencyId=${agencyId}`}
                </div>
                <button 
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedToken(null);
                  }}
                  className="w-full py-2 bg-gray-800 text-white rounded"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
