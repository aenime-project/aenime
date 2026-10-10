export default function getChapterStyles(intro, outro) {
  let styles = `
        .art-chapters {
            gap: 0px !important;
        }
    `;

  const validIntro =
    intro &&
    typeof intro.start === "number" &&
    typeof intro.end === "number" &&
    (intro.start !== 0 || intro.end !== 0);

  const validOutro =
    outro &&
    typeof outro.start === "number" &&
    typeof outro.end === "number" &&
    (outro.start !== 0 || outro.end !== 0);

  if (validIntro && validOutro) {
    if (intro.start === 0) {
      styles += `
        .art-chapter:nth-child(1), 
        .art-chapter:nth-child(3) {
            background-color: #fdd253;
            transform: scaleY(0.6);
        }
      `;
    } else {
      styles += `
        .art-chapter:nth-child(2),
        .art-chapter:nth-child(4) {
            background-color: #fdd253;
            transform: scaleY(0.6);
        }
      `;
    }
  } else if (validIntro) {
    const idx = intro.start === 0 ? 1 : 2;
    styles += `
      .art-chapter:nth-child(${idx}) {
          background-color: #fdd253;
          transform: scaleY(0.6);
      }
    `;
  } else if (validOutro) {
    styles += `
      .art-chapter:nth-child(2) {
          background-color: #fdd253;
          transform: scaleY(0.6);
      }
    `;
  }

  return styles;
}
