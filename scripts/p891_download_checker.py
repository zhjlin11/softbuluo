#!/usr/bin/env python3
import urllib.request
import urllib.error
import ssl
import json
import time
import socket

# Disable SSL verification for audit only, but record SSL status
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SoftTribeLinkAudit/1.0'
}

def check_url(url, timeout=6):
    res = {
        'url': url,
        'status': 'UNKNOWN',
        'http_code': 0,
        'final_url': url,
        'is_https': url.startswith('https://'),
        'error': None
    }
    
    # SSRF protection: reject private/loopback/cloud metadata
    try:
        from urllib.parse import urlparse
        host = urlparse(url).hostname
        if not host:
            res['status'] = 'INVALID_URL'
            return res
        ip = socket.gethostbyname(host)
        if ip.startswith(('127.', '10.', '192.168.', '169.254.')) or ip == '0.0.0.0':
            res['status'] = 'BLOCKED_PRIVATE_IP'
            return res
    except Exception as e:
        res['status'] = 'DNS_FAILED'
        res['error'] = str(e)
        return res

    req = urllib.request.Request(url, headers=HEADERS, method='HEAD')
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            res['http_code'] = response.status
            res['final_url'] = response.geturl()
            res['status'] = 'REACHABLE'
    except urllib.error.HTTPError as e:
        res['http_code'] = e.code
        # Some servers return 403/405 to HEAD, try a GET with Range: bytes=0-100
        if e.code in (403, 405, 503):
            try:
                get_req = urllib.request.Request(url, headers={**HEADERS, 'Range': 'bytes=0-100'}, method='GET')
                with urllib.request.urlopen(get_req, timeout=timeout, context=ctx) as get_resp:
                    res['http_code'] = get_resp.status
                    res['final_url'] = get_resp.geturl()
                    res['status'] = 'REACHABLE'
            except urllib.error.HTTPError as e2:
                res['http_code'] = e2.code
                if e2.code in (401, 403):
                    res['status'] = 'AUTH_OR_FORBIDDEN'
                else:
                    res['status'] = f'HTTP_{e2.code}'
            except Exception as e2:
                res['status'] = f'HTTP_{e.code}'
                res['error'] = str(e2)
        else:
            res['status'] = f'HTTP_{e.code}'
    except urllib.error.URLError as e:
        res['status'] = 'TIMEOUT_OR_UNREACHABLE'
        res['error'] = str(e.reason)
    except Exception as e:
        res['status'] = 'ERROR'
        res['error'] = str(e)

    return res

if __name__ == '__main__':
    print("Testing check_url...")
    print(check_url("https://www.google.com"))
