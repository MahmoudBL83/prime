# Element Description

This file documents the structure and class names of the provided element:

```
div.group.z-[1].transition-all.duration-[500ms].absolute.bottom-[20px].flex.w-full.flex-col.items-center.px-[3%].md:items-start.md:bottom-[25px].md:w-auto.md:px-[10px].lg:px-[1%].lg:vw-bottom-[130].xl:bottom-auto.xl:top-[112px].xl:px-[3%].2xl:vw-top-[112].ltr:md:left-0.rtl:md:right-0
```

## Class Breakdown

- `group` — Utility for group-hover/focus states
- `z-[1]` — z-index: 1
- `transition-all` — Transition all properties
- `duration-[500ms]` — Transition duration: 500ms
- `absolute` — Position: absolute
- `bottom-[20px]` — Bottom offset: 20px
- `flex` — Display: flex
- `w-full` — Width: 100%
- `flex-col` — Flex direction: column
- `items-center` — Align items: center
- `px-[3%]` — Padding left/right: 3%
- `md:items-start` — On md screens: align items start
- `md:bottom-[25px]` — On md screens: bottom 25px
- `md:w-auto` — On md screens: width auto
- `md:px-[10px]` — On md screens: padding left/right 10px
- `lg:px-[1%]` — On lg screens: padding left/right 1%
- `lg:vw-bottom-[130]` — On lg screens: bottom 130vw (custom class)
- `xl:bottom-auto` — On xl screens: bottom auto
- `xl:top-[112px]` — On xl screens: top 112px
- `xl:px-[3%]` — On xl screens: padding left/right 3%
- `2xl:vw-top-[112]` — On 2xl screens: top 112vw (custom class)
- `ltr:md:left-0` — On md screens, LTR: left 0
- `rtl:md:right-0` — On md screens, RTL: right 0

## Notes

- This element is a responsive, absolutely positioned flex container with RTL/LTR and breakpoint-specific adjustments.
- Some classes (e.g., `vw-bottom-[130]`, `vw-top-[112]`) may be custom utilities.
