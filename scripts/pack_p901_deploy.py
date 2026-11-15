import tarfile
import os

archive_name = 'p901_deploy.tar.gz'

print(f'Creating {archive_name}...')
with tarfile.open(archive_name, 'w:gz') as tar:
    if os.path.exists('dist'):
        print('Adding dist/ ...')
        tar.add('dist', arcname='dist')

    if os.path.exists('server'):
        print('Adding server/ ...')
        def filter_server(tarinfo):
            if 'node_modules' in tarinfo.name or '.git' in tarinfo.name:
                return None
            return tarinfo
        tar.add('server', arcname='server', filter=filter_server)

    if os.path.exists('scripts'):
        print('Adding scripts/ ...')
        tar.add('scripts', arcname='scripts')

    if os.path.exists('docs'):
        print('Adding docs/ ...')
        tar.add('docs', arcname='docs')

    if os.path.exists('package.json'):
        print('Adding package.json ...')
        tar.add('package.json', arcname='package.json')

size_mb = os.path.getsize(archive_name) / 1024 / 1024
print(f'Archive created successfully: {archive_name} ({size_mb:.2f} MB)')
