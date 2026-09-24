import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { langageDe } from './arbre';

// L'éditeur de l'atelier : CodeMirror 6 (licence MIT), choisi dans le plan
// parce qu'il marche au doigt sur téléphone (Monaco ne le fait pas).
// Les couleurs sont celles de Léo (bleu nuit, laiton), pas un thème importé.

const LANGAGES = {
  js: () => javascript({ jsx: true }),
  ts: () => javascript({ jsx: true, typescript: true }),
  py: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  texte: () => [],
};

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#0B1120', color: '#EDF1F8', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.55' },
  '.cm-content': { caretColor: '#E3A857' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#E3A857' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#2A3550' },
  '.cm-gutters': { backgroundColor: '#121A2B', color: '#93A1B8', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#1A233755' },
  '.cm-activeLineGutter': { backgroundColor: '#1A2337', color: '#E3A857' },
}, { dark: true });

// Les couleurs du code, prises dans la palette de Léo (laiton, turquoise,
// terracotta) pour rester lisibles sur le bleu nuit.
const couleurs = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword], color: '#E3A857' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: '#5FC8C0' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#F2C98A' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#93A1B8', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#F2C98A' },
  { tag: [tags.typeName, tags.className, tags.tagName], color: '#E07A55' },
  { tag: [tags.propertyName, tags.attributeName], color: '#C9D4E5' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], color: '#EDF1F8' },
  { tag: tags.invalid, color: '#FB7185' },
]);

export default function Editeur({ chemin, valeur, lectureSeule, onChange }) {
  const hote = useRef(null);
  const vue = useRef(null);
  const langage = useRef(new Compartment());
  const lecture = useRef(new Compartment());
  const rappel = useRef(onChange);
  rappel.current = onChange;

  useEffect(() => {
    const v = new EditorView({
      parent: hote.current,
      state: EditorState.create({
        doc: valeur ?? '',
        extensions: [
          basicSetup,
          theme,
          syntaxHighlighting(couleurs),
          EditorView.lineWrapping,
          langage.current.of(LANGAGES[langageDe(chemin)]()),
          lecture.current.of(EditorState.readOnly.of(!!lectureSeule)),
          EditorView.updateListener.of((u) => { if (u.docChanged) rappel.current?.(u.state.doc.toString()); }),
        ],
      }),
    });
    vue.current = v;
    return () => v.destroy();
    // L'éditeur est créé une fois ; les changements passent par les effets ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un autre fichier, ou le même fichier modifié par l'agent : on remplace le texte.
  useEffect(() => {
    const v = vue.current;
    if (!v) return;
    const actuel = v.state.doc.toString();
    const effets = [langage.current.reconfigure(LANGAGES[langageDe(chemin)]())];
    if ((valeur ?? '') !== actuel) v.dispatch({ changes: { from: 0, to: actuel.length, insert: valeur ?? '' }, effects: effets });
    else v.dispatch({ effects: effets });
  }, [chemin, valeur]);

  useEffect(() => {
    vue.current?.dispatch({ effects: lecture.current.reconfigure(EditorState.readOnly.of(!!lectureSeule)) });
  }, [lectureSeule]);

  return <div ref={hote} className="h-full min-h-0 overflow-hidden" />;
}
