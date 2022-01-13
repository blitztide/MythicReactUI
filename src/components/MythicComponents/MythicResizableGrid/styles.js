import { makeStyles } from '@material-ui/core';

export default makeStyles((theme) => ({
    headerCellRow: {
        display: 'flex',
        flexDirection: 'row',
        position: 'sticky',
        top: '0',
        left: '0',
        right: '0',
        zIndex: 1,
    },
    headerCell: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 0.25em',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        userSelect: 'none',
        backgroundColor: theme.palette.background.paper,
        borderTop: '1px solid #e0e0e0',
        borderRight: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0',
        '&:first-child': {
            borderLeft: '1px solid #e0e0e0',
        },
        '&:hover': {
            backgroundColor: theme.tableHover,
            cursor: 'pointer',
        },
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 0.25em',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        borderBottom: '1px solid #e0e0e0',
        cursor: "default !important",
        '&:hover': {
            backgroundColor: theme.tableHover,
            cursor: 'default !important',
        },
    },
    cellInner: {
        width: '100%',
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
    },
    draggableHandlesContainer: {
        position: 'absolute',
        top: 0,
        overflowX: 'hidden',
    },
    draggableHandlesClickArea: {
        position: 'absolute',
        top: 0,
        width: '16px',
        cursor: 'col-resize',
        pointerEvents: 'initial',
    },
    draggableHandlesIndicator: {
        position: 'absolute',
        top: 0,
        left: 8,
        width: '1px',
        backgroundImage: 'linear-gradient(#7f93c0, #00000000)',
    },
}));
