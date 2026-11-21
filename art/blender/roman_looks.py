"""Each man his own look (T-061) for the legionaries on the Roman source
body: roman-legionary, roman-hastatus, roman-triarii.

The Romans (the user's choice, 2026-11-21): shades of one colour, not many
colours. Polybius 6.39.15: the quaestor supplies the soldiers' food and
clothes, and any arms they need, and stops the price from their pay;
nothing says the clothes were all of one colour. The red is the model's
own (no source gives the colour of the tunics): it is kept and varied in
shade, darker, browner, washed out, as cloth of different lots, worn and
faded, would be (a choice, not a source). Polybius 6.23.12:
on the helmet a circle of three upright feathers, purple or black, about a
cubit high. The shields keep the model's red, in shades, without designs.
Beards: roman_beard (Pliny, Natural History 7.211).

The head's texture (skin and the short dark hair under the helmet) is one
slot, the skin; the beards are the hair slot, dyed, so they can be any
brown or black whatever the texture's hair.
"""

import whp_look

srgb, ONE = whp_look.srgb, whp_look.ONE

TUNIC = [(3, srgb(128, 28, 28)),        # the model's own red
         (2, srgb(106, 24, 24)),        # darker
         (2, srgb(138, 44, 32)),        # browner, brick
         (1, srgb(150, 64, 52)),        # washed out
         (1, srgb(114, 26, 38)),        # crimson
         (1, srgb(158, 84, 66))]        # much washed
CREST = [(3, srgb(149, 39, 60)),        # the model's purple, red-violet
         (2, srgb(102, 30, 66)),        # violet
         (1, srgb(76, 24, 50)),         # dark purple
         (3, srgb(34, 30, 32)),         # black
         (1, srgb(50, 42, 36))]         # brown-black
SHIELD = [(3, srgb(149, 48, 44)),       # the model's red
          (2, srgb(122, 40, 36)),
          (2, srgb(150, 66, 46)),
          (1, srgb(160, 88, 70)),
          (1, srgb(130, 38, 44))]
SKIN = [(3, ONE), (2, (0.93, 0.88, 0.84)), (2, (1.05, 1.01, 0.98)), (2, (0.86, 0.78, 0.70)),
        (1, (0.97, 0.90, 0.86))]
HAIR = [(4, srgb(62, 46, 34)),          # dark brown
        (3, srgb(38, 30, 24)),          # almost black
        (2, srgb(88, 64, 44)),          # brown
        (1, srgb(28, 24, 22))]          # black
# The triarii are the oldest men (Polybius 6.21.9; infantry served from 17
# to 46, 6.19.2): some beards turn grey.
HAIR_OLDER = HAIR + [(2, srgb(98, 88, 78)), (1, srgb(132, 126, 120))]

# Share of the beards (roman_beard.PARTS): clean shaven, short, full.
BEARDS = [(5, None), (3, "beard_short"), (2, "beard_full")]


def looks(beards=BEARDS, hair=HAIR):
    return whp_look.Looks(
        slots=[
            whp_look.Slot("tunic", "dye", TUNIC),
            whp_look.Slot("crest", "dye", CREST),
            whp_look.Slot("shield", "dye", SHIELD),
            whp_look.Slot("skin", "tint", SKIN),
            whp_look.Slot("hair", "dye", hair),
        ],
        parts={"head": ("skin", None), "arms": ("skin", None), "legs": ("skin", None),
               "tunic": ("tunic", None), "crest": ("crest", None), "shield": ("shield", None),
               "beard_short": ("hair", None), "beard_full": ("hair", None)},
        materials={"New_head0": "skin", "New_arms0": "skin", "New_legs0": "skin", "Tunic_10": "tunic",
                   "whp-feather": "crest", "whp-shield-paint": "shield", "whp-beard": "hair"},
        variants=[whp_look.Variants("beard", beards)],
    )
