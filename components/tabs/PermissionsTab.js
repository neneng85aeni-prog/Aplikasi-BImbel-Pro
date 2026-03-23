import { ALL_MENU_KEYS, TAB_LABELS, defaultPermissionsByRole } from '../../lib/constants'

export function PermissionsTab({ users, permissionUserId, setPermissionUserId, permissionDraft, onTogglePermission, onSavePermissions, onSelectAllPermissions, onResetPermissions }) {
  const selectedUser = users.find((item) => item.id === permissionUserId)

  return (
    <div className="grid grid-2 gap-lg">
      <div className="glass-card">
        <h2 className="section-title">Hak akses user per menu</h2>
        <div className="form-row">
          <label>Pilih user</label>
          <select value={permissionUserId} onChange={(e) => setPermissionUserId(e.target.value)}>
            <option value="">Pilih user</option>
            {users.map((item) => <option key={item.id} value={item.id}>{item.nama} • {item.akses}</option>)}
          </select>
        </div>

        {selectedUser ? (
          <div className="helper-box">
            User terpilih: <b>{selectedUser.nama}</b> • {selectedUser.akses} • {selectedUser.branch_nama || '-'}
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn btn-secondary btn-small" type="button" onClick={onSelectAllPermissions} disabled={!permissionUserId}>Pilih semua</button>
          <button className="btn btn-secondary btn-small" type="button" onClick={() => onResetPermissions(defaultPermissionsByRole(selectedUser?.akses || 'admin'))} disabled={!permissionUserId}>Reset default role</button>
        </div>

        <div className="permissions-grid" style={{ marginTop: 16 }}>
          {ALL_MENU_KEYS.map((item) => (
            <label key={item} className={`permission-card ${permissionDraft.includes(item) ? 'active' : ''}`}>
              <input type="checkbox" checked={permissionDraft.includes(item)} onChange={() => onTogglePermission(item)} disabled={!permissionUserId} />
              <span>{TAB_LABELS[item]}</span>
            </label>
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="btn btn-primary" type="button" onClick={onSavePermissions} disabled={!permissionUserId}>Simpan checklist</button>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Ringkasan akses</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Menu aktif</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama}</td>
                  <td>{item.akses}</td>
                  <td>{(item.menu_permissions || []).map((menu) => TAB_LABELS[menu] || menu).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
