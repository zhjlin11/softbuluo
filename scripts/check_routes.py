import re

files = [
    'server/src/modules/versions/versionRoutes.ts',
    'server/src/modules/linkHealth/linkHealthRoutes.ts',
    'server/src/modules/jobs/jobRoutes.ts',
    'server/src/modules/seo/seoAdminRoutes.ts',
    'server/src/modules/operations/operationsRoutes.ts'
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        print('=== ' + path + ' ===')
        matches = re.findall(r'server\.(get|post|put|delete|patch)\(\s*[\'"]([^\'"]+)[\'"]', f.read())
        for method, route in matches:
            print(f'  [{method.upper()}] {route}')
