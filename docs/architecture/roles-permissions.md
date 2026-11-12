# Rollen- und Berechtigungsmatrix – Phase 1

| Permission            | Inhaber/Admin | Büro | Meister | Monteur | Buchhaltung | Lesen |
| --------------------- | ------------: | ---: | ------: | ------: | ----------: | ----: |
| `tenant.read`         |             ✓ |    ✓ |       ✓ |       ✓ |           ✓ |     ✓ |
| `tenant.update`       |             ✓ |    – |       – |       – |           – |     – |
| `members.read`        |             ✓ |    ✓ |       ✓ |       – |           – |     – |
| `members.invite`      |             ✓ |    – |       – |       – |           – |     – |
| `members.role.assign` |             ✓ |    – |       – |       – |           – |     – |
| `members.disable`     |             ✓ |    – |       – |       – |           – |     – |
| `audit.read`          |             ✓ |    – |       – |       – |           – |     – |

Regeln:

- Deny by default.
- Policies werden serverseitig geprüft.
- Der letzte aktive Admin kann nicht deaktiviert oder herabgestuft werden.
- Rollenänderung, Einladung, Deaktivierung und Tenant-Wechsel werden auditiert.
