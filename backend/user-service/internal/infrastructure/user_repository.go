package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/user-service/internal/domain"
)

type PostgreSQLUserRepository struct {
	db DBInterface
}

func NewPostgreSQLUserRepository(db *DB) domain.UserRepository {
	return &PostgreSQLUserRepository{db: db}
}

// User operations
func (r *PostgreSQLUserRepository) CreateUser(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.db.ExecContext(ctx, query,
		user.ID.String(),
		user.Email,
		user.PasswordHash,
		user.RoleID.String(),
		user.IsActive,
		nullTimeOrPointer(user.LastLoginAt),
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		if isPrimaryKeyViolation(err) {
			return errors.WrapConflict("CreateUser", "user", "user with this ID already exists", err)
		}
		if isUniqueViolation(err) {
			return errors.WrapConflict("CreateUser", "user", "user with this email already exists", err)
		}
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (r *PostgreSQLUserRepository) GetUserByID(ctx context.Context, id domain.UserID) (*domain.User, error) {
	query := `
		SELECT id, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at
		FROM users 
		WHERE id = $1`

	user := &domain.User{}
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.RoleID,
		&user.IsActive,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetUserByID", "user", id.String(), err)
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	scanNullTime(&user.LastLoginAt, lastLoginAt)
	return user, nil
}

func (r *PostgreSQLUserRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at
		FROM users 
		WHERE email = $1`

	user := &domain.User{}
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.RoleID,
		&user.IsActive,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetUserByEmail", "user", email, err)
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	scanNullTime(&user.LastLoginAt, lastLoginAt)
	return user, nil
}

func (r *PostgreSQLUserRepository) GetUserWithRole(ctx context.Context, id domain.UserID) (*domain.UserWithRole, error) {
	query := `
		SELECT 
			u.id, u.email, u.password_hash, u.role_id, u.is_active, u.last_login_at, u.created_at, u.updated_at,
			r.id, r.name, r.description, r.created_at, r.updated_at
		FROM users u
		JOIN roles r ON u.role_id = r.id
		WHERE u.id = $1`

	user := &domain.User{}
	role := &domain.Role{}
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.RoleID, &user.IsActive, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt,
		&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetUserWithRole", "user", id.String(), err)
		}
		return nil, fmt.Errorf("failed to get user with role: %w", err)
	}

	scanNullTime(&user.LastLoginAt, lastLoginAt)
	user.Role = role

	// Get permissions for the role
	permissions, err := r.GetPermissionsByRoleID(ctx, role.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get role permissions: %w", err)
	}

	role.Permissions = permissions

	return &domain.UserWithRole{
		User:        user,
		Role:        role,
		Permissions: permissions,
	}, nil
}

func (r *PostgreSQLUserRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users 
		SET email = $2, role_id = $3, is_active = $4, updated_at = $5
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		user.ID.String(),
		user.Email,
		user.RoleID.String(),
		user.IsActive,
		time.Now(),
	)

	if err != nil {
		if isUniqueViolation(err) {
			return errors.WrapConflict("UpdateUser", "user", "user with this email already exists", err)
		}
		return fmt.Errorf("failed to update user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdateUser", "user", user.ID.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) UpdateUserPassword(ctx context.Context, id domain.UserID, passwordHash string) error {
	query := `
		UPDATE users 
		SET password_hash = $2, updated_at = $3
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id.String(), passwordHash, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update user password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdateUserPassword", "user", id.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) UpdateUserLastLogin(ctx context.Context, id domain.UserID, lastLoginAt time.Time) error {
	query := `
		UPDATE users 
		SET last_login_at = $2, updated_at = $3
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id.String(), lastLoginAt, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update user last login: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdateUserLastLogin", "user", id.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) DeleteUser(ctx context.Context, id domain.UserID) error {
	query := `DELETE FROM users WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id.String())
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("DeleteUser", "user", id.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) ListUsers(ctx context.Context, filters domain.UserFilters) ([]domain.User, error) {
	query := `
		SELECT id, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE 1=1`

	var args []interface{}
	argIndex := 1

	if filters.RoleID != nil {
		query += fmt.Sprintf(" AND role_id = $%d", argIndex)
		args = append(args, filters.RoleID.String())
		argIndex++
	}

	if filters.IsActive != nil {
		query += fmt.Sprintf(" AND is_active = $%d", argIndex)
		args = append(args, *filters.IsActive)
		argIndex++
	}

	if filters.Email != "" {
		query += fmt.Sprintf(" AND email ILIKE $%d", argIndex)
		args = append(args, "%"+filters.Email+"%")
		argIndex++
	}

	query += " ORDER BY created_at DESC"

	if filters.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, filters.Limit)
		argIndex++
	}

	if filters.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, filters.Offset)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		user := domain.User{}
		var lastLoginAt sql.NullTime

		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.PasswordHash,
			&user.RoleID,
			&user.IsActive,
			&lastLoginAt,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		scanNullTime(&user.LastLoginAt, lastLoginAt)
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate users: %w", err)
	}

	return users, nil
}

// Helper functions for error checking
func isPrimaryKeyViolation(err error) bool {
	return err != nil && err.Error() != "" // Simplified check - should use proper PostgreSQL error codes
}

func isUniqueViolation(err error) bool {
	return err != nil && err.Error() != "" // Simplified check - should use proper PostgreSQL error codes
}

// Role operations
func (r *PostgreSQLUserRepository) CreateRole(ctx context.Context, role *domain.Role) error {
	query := `
		INSERT INTO roles (id, name, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)`

	_, err := r.db.ExecContext(ctx, query,
		role.ID.String(),
		role.Name,
		role.Description,
		role.CreatedAt,
		role.UpdatedAt,
	)

	if err != nil {
		if isPrimaryKeyViolation(err) || isUniqueViolation(err) {
			return errors.WrapConflict("CreateRole", "role", "role with this name already exists", err)
		}
		return fmt.Errorf("failed to create role: %w", err)
	}

	return nil
}

func (r *PostgreSQLUserRepository) GetRoleByID(ctx context.Context, id domain.RoleID) (*domain.Role, error) {
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles 
		WHERE id = $1`

	role := &domain.Role{}

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&role.ID,
		&role.Name,
		&role.Description,
		&role.CreatedAt,
		&role.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetRoleByID", "role", id.String(), err)
		}
		return nil, fmt.Errorf("failed to get role by ID: %w", err)
	}

	return role, nil
}

func (r *PostgreSQLUserRepository) GetRoleByName(ctx context.Context, name string) (*domain.Role, error) {
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles 
		WHERE name = $1`

	role := &domain.Role{}

	err := r.db.QueryRowContext(ctx, query, name).Scan(
		&role.ID,
		&role.Name,
		&role.Description,
		&role.CreatedAt,
		&role.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetRoleByName", "role", name, err)
		}
		return nil, fmt.Errorf("failed to get role by name: %w", err)
	}

	return role, nil
}

func (r *PostgreSQLUserRepository) GetRoleWithPermissions(ctx context.Context, id domain.RoleID) (*domain.Role, error) {
	role, err := r.GetRoleByID(ctx, id)
	if err != nil {
		return nil, err
	}

	permissions, err := r.GetPermissionsByRoleID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get role permissions: %w", err)
	}

	role.Permissions = permissions
	return role, nil
}

func (r *PostgreSQLUserRepository) UpdateRole(ctx context.Context, role *domain.Role) error {
	query := `
		UPDATE roles 
		SET name = $2, description = $3, updated_at = $4
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		role.ID.String(),
		role.Name,
		role.Description,
		time.Now(),
	)

	if err != nil {
		if isUniqueViolation(err) {
			return errors.WrapConflict("UpdateRole", "role", "role with this name already exists", err)
		}
		return fmt.Errorf("failed to update role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdateRole", "role", role.ID.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) DeleteRole(ctx context.Context, id domain.RoleID) error {
	query := `DELETE FROM roles WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id.String())
	if err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("DeleteRole", "role", id.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) ListRoles(ctx context.Context) ([]domain.Role, error) {
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles
		ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list roles: %w", err)
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		role := domain.Role{}

		err := rows.Scan(
			&role.ID,
			&role.Name,
			&role.Description,
			&role.CreatedAt,
			&role.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}

		roles = append(roles, role)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate roles: %w", err)
	}

	return roles, nil
}

// Permission operations
func (r *PostgreSQLUserRepository) CreatePermission(ctx context.Context, permission *domain.Permission) error {
	query := `
		INSERT INTO permissions (id, name, resource, action, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := r.db.ExecContext(ctx, query,
		permission.ID.String(),
		permission.Name,
		permission.Resource,
		permission.Action,
		permission.Description,
		permission.CreatedAt,
	)

	if err != nil {
		if isPrimaryKeyViolation(err) || isUniqueViolation(err) {
			return errors.WrapConflict("CreatePermission", "permission", "permission already exists", err)
		}
		return fmt.Errorf("failed to create permission: %w", err)
	}

	return nil
}

func (r *PostgreSQLUserRepository) GetPermissionByID(ctx context.Context, id domain.PermissionID) (*domain.Permission, error) {
	query := `
		SELECT id, name, resource, action, description, created_at
		FROM permissions 
		WHERE id = $1`

	permission := &domain.Permission{}

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&permission.ID,
		&permission.Name,
		&permission.Resource,
		&permission.Action,
		&permission.Description,
		&permission.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetPermissionByID", "permission", id.String(), err)
		}
		return nil, fmt.Errorf("failed to get permission by ID: %w", err)
	}

	return permission, nil
}

func (r *PostgreSQLUserRepository) UpdatePermission(ctx context.Context, permission *domain.Permission) error {
	query := `
		UPDATE permissions 
		SET name = $2, resource = $3, action = $4, description = $5
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		permission.ID.String(),
		permission.Name,
		permission.Resource,
		permission.Action,
		permission.Description,
	)

	if err != nil {
		if isUniqueViolation(err) {
			return errors.WrapConflict("UpdatePermission", "permission", "permission already exists", err)
		}
		return fmt.Errorf("failed to update permission: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdatePermission", "permission", permission.ID.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) DeletePermission(ctx context.Context, id domain.PermissionID) error {
	query := `DELETE FROM permissions WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id.String())
	if err != nil {
		return fmt.Errorf("failed to delete permission: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("DeletePermission", "permission", id.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) ListPermissions(ctx context.Context) ([]domain.Permission, error) {
	query := `
		SELECT id, name, resource, action, description, created_at
		FROM permissions
		ORDER BY resource, action`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list permissions: %w", err)
	}
	defer rows.Close()

	var permissions []domain.Permission
	for rows.Next() {
		permission := domain.Permission{}

		err := rows.Scan(
			&permission.ID,
			&permission.Name,
			&permission.Resource,
			&permission.Action,
			&permission.Description,
			&permission.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}

		permissions = append(permissions, permission)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate permissions: %w", err)
	}

	return permissions, nil
}

func (r *PostgreSQLUserRepository) GetPermissionsByRoleID(ctx context.Context, roleID domain.RoleID) ([]domain.Permission, error) {
	query := `
		SELECT p.id, p.name, p.resource, p.action, p.description, p.created_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1
		ORDER BY p.resource, p.action`

	rows, err := r.db.QueryContext(ctx, query, roleID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get permissions by role ID: %w", err)
	}
	defer rows.Close()

	var permissions []domain.Permission
	for rows.Next() {
		permission := domain.Permission{}

		err := rows.Scan(
			&permission.ID,
			&permission.Name,
			&permission.Resource,
			&permission.Action,
			&permission.Description,
			&permission.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}

		permissions = append(permissions, permission)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate permissions: %w", err)
	}

	return permissions, nil
}

// Role-Permission associations
func (r *PostgreSQLUserRepository) AssignPermissionToRole(ctx context.Context, roleID domain.RoleID, permissionID domain.PermissionID) error {
	query := `
		INSERT INTO role_permissions (role_id, permission_id, created_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (role_id, permission_id) DO NOTHING`

	_, err := r.db.ExecContext(ctx, query, roleID.String(), permissionID.String(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to assign permission to role: %w", err)
	}

	return nil
}

func (r *PostgreSQLUserRepository) RemovePermissionFromRole(ctx context.Context, roleID domain.RoleID, permissionID domain.PermissionID) error {
	query := `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`

	result, err := r.db.ExecContext(ctx, query, roleID.String(), permissionID.String())
	if err != nil {
		return fmt.Errorf("failed to remove permission from role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("RemovePermissionFromRole", "role_permission", fmt.Sprintf("%s-%s", roleID.String(), permissionID.String()), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) SetRolePermissions(ctx context.Context, roleID domain.RoleID, permissionIDs []domain.PermissionID) error {
	// Only works if db is actually a *DB (not TxDB)
	if dbConn, ok := r.db.(*DB); ok {
		return dbConn.WithTx(ctx, func(tx *sql.Tx) error {
			// Delete existing permissions for the role
			deleteQuery := `DELETE FROM role_permissions WHERE role_id = $1`
			_, err := tx.ExecContext(ctx, deleteQuery, roleID.String())
			if err != nil {
				return fmt.Errorf("failed to delete existing role permissions: %w", err)
			}

			// Insert new permissions
			if len(permissionIDs) > 0 {
				insertQuery := `
					INSERT INTO role_permissions (role_id, permission_id, created_at)
					VALUES ($1, $2, $3)`

				for _, permissionID := range permissionIDs {
					_, err := tx.ExecContext(ctx, insertQuery, roleID.String(), permissionID.String(), time.Now())
					if err != nil {
						return fmt.Errorf("failed to insert role permission: %w", err)
					}
				}
			}

			return nil
		})
	}
	return fmt.Errorf("transaction not supported on transaction repository")
}

// Session operations (to be continued...)
func (r *PostgreSQLUserRepository) CreateSession(ctx context.Context, session *domain.UserSession) error {
	query := `
		INSERT INTO user_sessions (id, user_id, token_hash, refresh_token_hash, expires_at, ip_address, user_agent, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := r.db.ExecContext(ctx, query,
		session.ID.String(),
		session.UserID.String(),
		session.TokenHash,
		session.RefreshToken,
		session.ExpiresAt,
		session.IPAddress,
		session.UserAgent,
		session.IsActive,
		session.CreatedAt,
		session.UpdatedAt,
	)

	if err != nil {
		if isPrimaryKeyViolation(err) {
			return errors.WrapConflict("CreateSession", "session", "session with this ID already exists", err)
		}
		return fmt.Errorf("failed to create session: %w", err)
	}

	return nil
}

func (r *PostgreSQLUserRepository) GetSessionByID(ctx context.Context, id domain.UserSessionID) (*domain.UserSession, error) {
	query := `
		SELECT id, user_id, token_hash, refresh_token_hash, expires_at, ip_address, user_agent, is_active, created_at, updated_at
		FROM user_sessions 
		WHERE id = $1`

	session := &domain.UserSession{}

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.RefreshToken,
		&session.ExpiresAt,
		&session.IPAddress,
		&session.UserAgent,
		&session.IsActive,
		&session.CreatedAt,
		&session.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetSessionByID", "session", id.String(), err)
		}
		return nil, fmt.Errorf("failed to get session by ID: %w", err)
	}

	return session, nil
}

func (r *PostgreSQLUserRepository) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*domain.UserSession, error) {
	query := `
		SELECT id, user_id, token_hash, refresh_token_hash, expires_at, ip_address, user_agent, is_active, created_at, updated_at
		FROM user_sessions 
		WHERE token_hash = $1 AND is_active = TRUE`

	session := &domain.UserSession{}

	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.RefreshToken,
		&session.ExpiresAt,
		&session.IPAddress,
		&session.UserAgent,
		&session.IsActive,
		&session.CreatedAt,
		&session.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("GetSessionByTokenHash", "session", tokenHash, err)
		}
		return nil, fmt.Errorf("failed to get session by token hash: %w", err)
	}

	return session, nil
}

func (r *PostgreSQLUserRepository) GetActiveSessionsByUserID(ctx context.Context, userID domain.UserID) ([]domain.UserSession, error) {
	query := `
		SELECT id, user_id, token_hash, refresh_token_hash, expires_at, ip_address, user_agent, is_active, created_at, updated_at
		FROM user_sessions 
		WHERE user_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get active sessions by user ID: %w", err)
	}
	defer rows.Close()

	var sessions []domain.UserSession
	for rows.Next() {
		session := domain.UserSession{}

		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.TokenHash,
			&session.RefreshToken,
			&session.ExpiresAt,
			&session.IPAddress,
			&session.UserAgent,
			&session.IsActive,
			&session.CreatedAt,
			&session.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}

		sessions = append(sessions, session)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate sessions: %w", err)
	}

	return sessions, nil
}

func (r *PostgreSQLUserRepository) UpdateSession(ctx context.Context, session *domain.UserSession) error {
	query := `
		UPDATE user_sessions 
		SET token_hash = $2, refresh_token_hash = $3, expires_at = $4, is_active = $5, updated_at = $6
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		session.ID.String(),
		session.TokenHash,
		session.RefreshToken,
		session.ExpiresAt,
		session.IsActive,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdateSession", "session", session.ID.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) InvalidateSession(ctx context.Context, id domain.UserSessionID) error {
	query := `
		UPDATE user_sessions 
		SET is_active = FALSE, updated_at = $2
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id.String(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to invalidate session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("InvalidateSession", "session", id.String(), nil)
	}

	return nil
}

func (r *PostgreSQLUserRepository) InvalidateUserSessions(ctx context.Context, userID domain.UserID) error {
	query := `
		UPDATE user_sessions 
		SET is_active = FALSE, updated_at = $2
		WHERE user_id = $1 AND is_active = TRUE`

	_, err := r.db.ExecContext(ctx, query, userID.String(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to invalidate user sessions: %w", err)
	}

	return nil
}

func (r *PostgreSQLUserRepository) CleanupExpiredSessions(ctx context.Context) error {
	query := `DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP OR is_active = FALSE`

	_, err := r.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}

	return nil
}

// Transaction support
func (r *PostgreSQLUserRepository) WithTx(ctx context.Context, fn func(domain.UserRepository) error) error {
	// Only works if db is actually a *DB (not TxDB)
	if dbConn, ok := r.db.(*DB); ok {
		return dbConn.WithTx(ctx, func(tx *sql.Tx) error {
			txRepo := &PostgreSQLUserRepository{db: &TxDB{Tx: tx}}
			return fn(txRepo)
		})
	}
	return fmt.Errorf("transaction not supported on transaction repository")
}