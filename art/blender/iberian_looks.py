"""Each man his own look (T-061) for the Iberians on the Roman source body
(iberian-infantry, iberian-gallic-cavalry).

Hannibal's men: strong variety (the user's choice, 2026-11-21), except
where a source fixes it: the tunics are white linen bordered with purple
(Polybius 3.114.4), so only the linen's white (bleached, unbleached,
worn) and the purple's shade vary. The shields: hide or paint, many with
a device (Iberian warriors carved at Osuna carry decorated shields).
"""

import whp_look

srgb, ONE = whp_look.srgb, whp_look.ONE

LINEN = [(3, srgb(228, 226, 218)), (2, srgb(206, 198, 178)), (2, srgb(214, 210, 198)), (1, srgb(196, 184, 156)),
         (1, srgb(182, 176, 164))]
PURPLE = [(3, srgb(124, 44, 77)), (2, srgb(96, 30, 70)), (2, srgb(140, 40, 52)), (1, srgb(72, 24, 52))]
SHIELD = [(3, srgb(124, 97, 69)), (2, srgb(150, 120, 84)), (2, srgb(92, 70, 50)), (1, srgb(200, 190, 165)),
          (1, srgb(146, 60, 44)), (1, srgb(60, 56, 52))]
SKIN = [(3, ONE), (2, (0.90, 0.85, 0.80)), (2, (1.08, 1.04, 1.00)), (2, (0.84, 0.77, 0.70)), (1, (1.02, 0.94, 0.88))]
HAIR = [(4, srgb(36, 28, 22)), (3, srgb(52, 40, 30)), (2, srgb(24, 21, 19)), (1, srgb(76, 56, 40))]
CAP = [(3, ONE), (2, (0.78, 0.76, 0.74)), (2, (1.18, 1.12, 1.04)), (1, (0.92, 0.80, 0.68))]
BEARDS = [(5, None), (3, "beard_short"), (2, "beard_full")]
DESIGNS = whp_look.Designs(
    "shield",
    [(3, None), (1, "rim"), (1, "rings"), (1, "rays"), (1, "cross"), (1, "lunettes"), (1, "band")],
    [(2, srgb(222, 212, 186)), (2, srgb(160, 50, 40)), (1, srgb(30, 30, 30)), (1, srgb(200, 160, 80))])
