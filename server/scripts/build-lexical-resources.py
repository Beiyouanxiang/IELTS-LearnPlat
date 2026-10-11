"""在开发机筛选官方开放语料；不会读取或写入学习数据库。
python3 scripts/build-lexical-resources.py CORPUS_DIR OUTPUT_JSONL
CORPUS_DIR: targets.json, wordnet.xml.gz, eng.tsv.bz2, cmn.tsv.bz2, links.tsv.bz2
"""
import bz2
import gzip
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

root, output = Path(sys.argv[1]), Path(sys.argv[2])
targets = {row['lemma'].lower(): row['word'] for row in json.loads((root / 'targets.json').read_text())}
entries, synset_words, synset_ids = defaultdict(list), defaultdict(list), set()
with gzip.open(root / 'wordnet.xml.gz', 'rb') as source:
    for event, element in ET.iterparse(source, events=('end',)):
        if element.tag != 'LexicalEntry':
            continue
        lemma = element.find('Lemma').attrib['writtenForm']
        for sense in element.findall('Sense'):
            sid = sense.attrib['synset']
            synset_words[sid].append(lemma)
            if lemma.lower() in targets:
                entries[lemma.lower()].append(sid)
                synset_ids.add(sid)
        element.clear()

senses = {}
with gzip.open(root / 'wordnet.xml.gz', 'rb') as source:
    for event, element in ET.iterparse(source, events=('end',)):
        if element.tag == 'Synset':
            sid = element.attrib['id']
            if sid in synset_ids:
                senses[sid] = {
                    'pos': element.attrib.get('partOfSpeech', ''),
                    'definition': element.findtext('Definition') or '',
                    'synonyms': synset_words[sid][:12],
                    'examples': [item.text or '' for item in element.findall('Example')],
                }
            element.clear()
        elif element.tag == 'LexicalEntry':
            element.clear()

translations = {}
with bz2.open(root / 'cmn.tsv.bz2', 'rt', encoding='utf8') as source:
    for line in source:
        fields = line.rstrip('\n').split('\t')
        if len(fields) >= 4:
            translations[fields[0]] = (fields[2], fields[3])
links = {}
with bz2.open(root / 'links.tsv.bz2', 'rt', encoding='utf8') as source:
    for line in source:
        first, second = line.strip().split('\t')[:2]
        if second in translations and first not in links:
            links[first] = (second, *translations[second])

examples = defaultdict(list)
tokens = re.compile(r"[a-z]+(?:[-'][a-z]+)*")
excluded = re.compile(r'\b(fuck|shit|porn|sex|sexual|penis|vagina|kill|murder|suicide|rape|nigger)\b', re.I)
def consider(lemma, example, score):
    bucket = examples[lemma]
    if any(item[1]['en'].lower() == example['en'].lower() for item in bucket):
        return
    bucket.append((score, example))
    bucket.sort(key=lambda item: item[0], reverse=True)
    del bucket[3:]

with bz2.open(root / 'eng.tsv.bz2', 'rt', encoding='utf8') as source:
    for line in source:
        fields = line.rstrip('\n').split('\t')
        if len(fields) < 4:
            continue
        sid, _, sentence, author = fields[:4]
        words = tokens.findall(sentence.lower())
        if not 6 <= len(words) <= 24 or excluded.search(sentence) or len(sentence) > 240:
            continue
        matches = {word for word in set(words) if word in targets}
        if not matches:
            continue
        translated = links.get(sid)
        example = {'en': sentence, 'source': 'Tatoeba', 'url': f'https://tatoeba.org/en/sentences/show/{sid}', 'author': author if author != '\\N' else 'Tatoeba contributors', 'license': 'CC BY 2.0 FR'}
        if translated:
            example.update({'cn': translated[1], 'translation_url': f'https://tatoeba.org/en/sentences/show/{translated[0]}', 'translation_author': translated[2] if translated[2] != '\\N' else 'Tatoeba contributors'})
        score = (100 if translated else 0) + (15 if author in ('CK', 'Hybrid', 'Nero', 'AlanF_US') else 0) - abs(len(words) - 12)
        for lemma in matches:
            consider(lemma, example, score)

output.parent.mkdir(parents=True, exist_ok=True)
coverage = defaultdict(int)
with output.open('w', encoding='utf8') as target:
    for lemma in sorted(targets):
        dictionary = []
        for sid in entries.get(lemma, [])[:4]:
            sense = senses.get(sid)
            if not sense or not sense['definition']:
                continue
            dictionary.append({'pos': sense['pos'], 'definition': sense['definition'], 'synonyms': [word for word in sense['synonyms'] if word.lower() != lemma]})
            for sentence in sense['examples']:
                if lemma in tokens.findall(sentence.lower()) and not excluded.search(sentence):
                    consider(lemma, {'en': sentence, 'source': 'Open English WordNet 2025', 'url': 'https://en-word.net/', 'author': 'Open English WordNet contributors / Princeton WordNet', 'license': 'CC BY 4.0'}, -100)
        selected = [item[1] for item in examples[lemma]]
        coverage[len(selected)] += 1
        target.write(json.dumps({'lemma': lemma, 'dictionary': dictionary, 'examples': selected}, ensure_ascii=False) + '\n')
print(json.dumps({'words': len(targets), 'dictionary_coverage': len(entries), 'example_count_distribution': dict(coverage), 'bytes': output.stat().st_size}))
