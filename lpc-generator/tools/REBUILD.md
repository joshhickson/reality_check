How to (Re)Build Sheets With LPC Tools
=============================================

The instructions below can be used to build or rebuild sheets if so desired using LPCTools.


### Install LPCTools
[LPCTools](https://github.com/bluecarrot16/lpctools) must be installed first.

[Install LPCTools and its prerequisites using these instructions.](LPCTOOLS.md)


#### Rebuild Sheets

Rebuilding sheets can be useful if you expand lpctools to support other base assets in the future.

To rebuild the sheets from scratch, run the following commands in a command terminal:
1. `wsl` (only if running from windows)
2. `conda activate lpctools`
3. `cd /path/to/folder/`
    - Alternatively, you can include the full path to the folder and/or file in `--input` and `--output`
4. `lpctools arrange distribute --input _build/ --output universal.png --mask masks/masks_male_head.png --offsets masks/reference_points.png --layout universal-expanded`
5. `lpctools arrange separate --input universal.png --output-dir universal/ --layout universal-expanded`
    - `lpctools arrange repack --input universal.png --from universal-expanded --to cast thrust walk slash short hurt climb idle jump sit emote run combat_idle backslash halfslash --output-dir _universal/ --layout universal-expanded`
6. `lpctools arrange combine --input _universal/ --output _combined.png --layout universal-expanded`
    - `lpctools arrange repack --input _universal/{cast,thrust,walk,slash,shoot,hurt,climb,idle,jump,sit,emote,run,combat_idle,backslash,halfslash} --from cast thrust walk slash short hurt climb idle jump sit emote run combat_idle backslash halfslash --to universal-expanded --output-dir _combined.png --layout universal-expanded`

The "layout" should be whatever layout you wish, but universal-expanded is the original "universal" layout from the Universal LPC Spritesheet but with additional animation bases added onto it. To get the original universal sheets before expanded frames were added, use the "universal" layout rather than "universal-expanded".

"Masks" are complete sheets of masks outlining where certain assets are that cut out other parts. The "head" masks are for cutting out arms from assets appearing on thte head. The reference_points adjust the position of assets on the universal-expanded sheet. If you change the layout the reference points and masks will also need to be adjusted.

"Distribute" is used to take single frames and drop them across all frames. They must mapped to a specific structure. Please see how these are configured in lpctools or check the `build/male_template.png` or `build/female_template.png` files.

"Separate" takes a full sheet and splits the assets into separate smaller sheets. This is based on the layout you request. Running this command is completely optional but makes it easier to parse out assets.

"Combine" takes the separated sheets and recombines them back into a full sheet based on the animation filenames in the directory provided. This should be applied in the layout you give.

"Repack" can be used to handle either separate or combine, or switch to a different format entirely.


#### Getting Repalettes

To get repalettes, simply run the following command:
`lpctools colors recolor --input universal.png --mapping palettes/ulpc-body-palette.json`

You can do this with any files and any of the palette sheets. The palette sheet name applies to the type of material used in the sheet, and you can usually figure out what matches it based on the sheet. If the base colors to not match the "source" in the palette sheet, the repalette won't work.

For more information on palettes, check out the following:
- [Standard ULPC Palettes](palettes/README.md)
- [Custom Palettes](palettes/custom/README.md) (used for specific assets)
- [Convert to LPC Revised Palettes or Visa-Versa](palettes/conversions/README.md)

Brand new custom palette sheets can be made by following the existing examples, but the ones collected here are fairly standard.