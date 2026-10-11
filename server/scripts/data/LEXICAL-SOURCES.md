# 单词资源来源与许可

`lexical-resources.jsonl` 是下列开放资源按项目 7,419 个词条筛选得到的数据子集；它不包含用户信息。

- Open English WordNet 2025，源自 Princeton WordNet，由 Open English WordNet 社区维护。英文释义、同义词与标注的词典例句按 CC BY 4.0 使用。作者归属：Open English WordNet contributors / Princeton WordNet。项目：https://en-word.net/ ，数据：https://en-word.net/downloads/english-wordnet-2025.xml.gz ，许可：https://creativecommons.org/licenses/by/4.0/ 。按词条提取至多四个义项，未改写定义。
- Tatoeba 2026-10-10 周导出。例句及关联中文译文按 CC BY 2.0 FR 使用。原句作者、句子 ID、原句链接与译文作者均保留在各条记录中。项目与说明：https://tatoeba.org/en/downloads ，许可：https://creativecommons.org/licenses/by/2.0/fr/ 。语料来自 `eng_sentences_detailed.tsv.bz2`、`cmn_sentences_detailed.tsv.bz2` 与 `eng-cmn_links.tsv.bz2`。优先保留带中文译文的适中长度例句，再补英语例句；不翻译、不改写文本。
- 学习方法的参考文档：https://docs.ankiweb.net/background.html 。界面中的主动回忆、例句挖空、个人造句与间隔复习提示是本项目原创提示，不复制 Anki 手册正文。词族来自既有词表，不把拼写联想说成真实词源。

原有 67 个项目例句保留；新增例句每词最多三条，并去重。Tatoeba 是社区语料，WordNet 是开放词汇数据库，两者都不是雅思官方题库；不同资源覆盖不齐时如实显示，不以模板句冒充语料。配套按钮可以访问原始来源进一步核对。

生成器在开发机运行 `python3 scripts/build-lexical-resources.py CORPUS_DIR scripts/data/lexical-resources.jsonl`；服务器只运行流式导入器 `node scripts/import-lexical-resources.mjs`。词条按 lemma 匹配，导入幂等且不更改用户复习进度。
