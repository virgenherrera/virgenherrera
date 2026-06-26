export const LAYOUT = {
  jumbotron: {
    selector: '.vh-jumbotron',
    viewportWidthRatio: 1,
    viewportHeightRatio: 1,
  },
  sidebar: {
    selector: '.sidebar',
    parentWidthRatio: 0.3,
  },
  content: {
    selector: '.main-content',
    parentWidthRatio: 0.7,
  },
  contentArea: {
    selector: '.content-area',
    display: 'flex',
  },
} as const;
