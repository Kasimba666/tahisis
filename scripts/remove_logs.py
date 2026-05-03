import re, os

base = r'd:\_projects\tahisis'

files = [
    'src/components/MapView.vue',
    'src/components/maps/OpenLayersMap.vue',
    'src/components/maps/LeafletMap.vue',
    'src/components/SettlementsListAndMap.vue',
    'src/components/EstatesFilters.vue',
    'src/components/SettlementDetails.vue',
    'src/components/SubtypeEstateDetails.vue',
    'src/pages/PgEstateTypes.vue',
    'src/pages/PgSettlements.vue',
    'src/pages/PgVectorLayers.vue',
    'src/components/VectorLayerStyleEditor.vue',
    'src/components/VectorLayerUpload.vue',
    'src/pages/PgRevisionsUpload.vue',
    'src/components/ExcelRevisionsUpload.vue',
]

pattern = re.compile(r'^\s*console\.(log|warn)\(')

for rel in files:
    fpath = os.path.join(base, rel.replace('/', os.sep))
    if not os.path.exists(fpath):
        print(f'SKIP (not found): {fpath}')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    removed = 0
    new_lines = []
    for line in lines:
        if pattern.match(line):
            removed += 1
        else:
            new_lines.append(line)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f'DONE: {rel} (removed {removed} lines)')

print('All done.')
