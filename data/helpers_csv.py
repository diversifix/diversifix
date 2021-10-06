import pandas as pd

def dict_to_csvs(dic: Dict[str, Dict[str, List[str]]], name: str) -> None:
    for n in ["sg", "pl"]:
        df = pd.DataFrame.from_dict(dic[n], orient="index")
        df.to_csv("{}_{}.csv".format(name, n), header=False)


def csvs_to_dict(
    name: str, numbers: List[str] = ["sg", "pl"]
) -> Dict[str, Dict[str, List[str]]]:
    dic: Dict[str, Dict[str, List[str]]] = {"sg": {}, "pl": {}}
    for n in numbers:
        df = pd.read_csv("{}_{}.csv".format(name, n), header=None)
        d = df.set_index(0).T.to_dict("list")
        d = dict(
            [
                (key, [val for val in vals if type(val) == str])
                for key, vals in d.items()
            ]
        )
        dic[n] = d
    return dic