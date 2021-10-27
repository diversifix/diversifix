from inclusify_server.helpers import add_to_dict, open_
from os import path
from tqdm import tqdm
import csv
import inclusify_server.download_language_models
import itertools
import stanza


def preprocess_rules():
    print("Looking for rule changes in `data/unified.csv`.")
    rules = read_rule_file("unified.csv")
    old_rules = read_rule_file("unified.csv.old")
    processed_rules = list(csv.reader(open_(path.join("data", "processed.csv"))))
    print("Removing old rules ...")
    for insensitive, sensitive, plural_only, source in tqdm(
        old_rules.difference(rules)
    ):
        for i, (_, _, insensitive_, sensitive_, plural_only_, source_) in enumerate(
            processed_rules
        ):
            if (
                insensitive == insensitive_
                and sensitive == sensitive_
                and plural_only == plural_only_
                and source == source_
            ):
                del processed_rules[i]
    print("Processing new rules ...")
    new_rules = rules.difference(old_rules)
    if len(new_rules) > 0:
        nlp = stanza.Pipeline(lang="de", processors="tokenize,mwt,pos,lemma")
        for rule in tqdm(new_rules):
            processed_rules += lemmatize_rule(rule)

    csv.writer(open_(path.join("data", "unified.csv.old"), "w")).writerows(
        sorted(list(rules))
    )
    csv.writer(open_(path.join("data", "processed.csv"), "w")).writerows(
        sorted(processed_rules)
    )
    print("Rule changes have been processed.")


def lemmatize_rule(rule):
    # save the lemma of the root of the insensitive part of each rule for easy matching
    (insensitive, sensitive, plural_only, source) = rule
    doc = nlp(insensitive)
    insensitive_lemmas = ";".join(
        list(
            itertools.chain(
                *[
                    [word.lemma for word in sentence.words]
                    for sentence in nlp(insensitive).sentences
                ]
            )
        )
    )
    for sentence in doc.sentences:
        for word in sentence.words:
            if word.head == 0:
                return [
                    [
                        word.lemma,
                        insensitive_lemmas,
                        insensitive,
                        sensitive,
                        plural_only,
                        source,
                    ]
                ]
    print("Rule could not be lemmatized:", rule)
    return []


def read_rule_file(x):
    return set(
        [(a, b, c, d) for [a, b, c, d] in csv.reader(open_(path.join("data", x)))]
    )


def load_rules():
    preprocess_rules()
    dic = {}
    for [
        lemma,
        insensitive_lemmas,
        insensitive,
        sensitive,
        plural_only,
        source,
    ] in csv.reader(open_(path.join("data", "processed.csv"))):
        plural_only = True if plural_only == "1" else False
        add_to_dict(
            lemma,
            [(insensitive_lemmas, insensitive, sensitive, plural_only, source)],
            dic,
        )
    return dic