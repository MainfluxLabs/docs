# Certs

The Certs service issues and manages X.509 certificates for IoT things, enabling mutual TLS (mTLS) authentication between devices and the platform. Certificates are signed by a local CA and identified by their serial number; each certificate records the associated thing ID in its subject.

| Field              | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `serial`           | Certificate serial number (hex string) — used as the unique identifier |
| `thing_id`         | ID of the thing the certificate was issued for                         |
| `certificate`      | PEM-encoded X.509 certificate                                          |
| `issuing_ca`       | PEM-encoded certificate of the issuing CA                              |
| `ca_chain`         | Full CA certificate chain in PEM format                                |
| `private_key`      | PEM-encoded private key corresponding to the certificate               |
| `private_key_type` | Key algorithm: `rsa` or `ec`                                           |
| `expires_at`       | Certificate expiration timestamp (RFC 3339)                            |

## Issuing a Certificate

Provide the thing ID, a validity period (`ttl`, a Go duration string such as `8760h` for one year), and the key type/size.

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "thing_id": "123e4567-e89b-12d3-a456-426614174000",
    "ttl": "8760h",
    "key_type": "rsa",
    "key_bits": 2048
  }' \
  http://localhost/certs
```

The response includes the PEM-encoded certificate, private key, issuing CA, CA chain, and the serial number needed for later operations. `key_type` supports `rsa` (use `key_bits` 2048 or 4096) or `ec` (use `key_bits` 256 or 384).

## Retrieving a Certificate

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/certs/<serial>
```

Returns the certificate metadata (`thing_id`, `certificate`, `serial`, `expires_at`, `downloaded`) — not the private key.

## Listing Certificate Serials for a Thing

```bash
curl -s -S -i \
  -H "Authorization: Bearer <user_token>" \
  "http://localhost/things/<thing_id>/serials?offset=0&limit=20"
```

## Renewing a Certificate

Renewal is only permitted within 30 days of the certificate's expiration date. A new certificate with an extended validity period is issued and returned.

```bash
curl -s -S -i -X PUT \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/certs/<serial>
```

## Rotating a Certificate

Revokes the certificate at the given serial and issues a new one for the specified thing in a single call.

```bash
curl -s -S -i -X POST \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "thing_id": "123e4567-e89b-12d3-a456-426614174000",
    "ttl": "8760h",
    "key_type": "rsa",
    "key_bits": 2048
  }' \
  http://localhost/certs/<serial>/rotate
```

## Revoking a Certificate

```bash
curl -s -S -i -X DELETE \
  -H "Authorization: Bearer <user_token>" \
  http://localhost/certs/<serial>
```

## Device Self-Provisioning: Downloading a Certificate

A thing can fetch its own full certificate data (certificate, private key, issuing CA, CA chain) using its thing key instead of a user token. **A certificate can only be downloaded once** — subsequent attempts return `403`.

```bash
curl -s -S -i \
  -H "Authorization: Thing <thing_key>" \
  http://localhost/certs/<serial>/download
```

For the full API reference, see the [API documentation](https://mainfluxlabs.github.io/docs/swagger/).
