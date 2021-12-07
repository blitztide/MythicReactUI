import React, { useEffect } from 'react';
import {IconButton, Typography, Link} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { toLocalTime } from '../../utilities/Time';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import {useTheme} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import Tooltip from '@material-ui/core/Tooltip';
import ConfirmationNumberIcon from '@material-ui/icons/ConfirmationNumber';
import EditIcon from '@material-ui/icons/Edit';
import {TaskTokenDialog} from '../Callbacks/TaskTokenDialog';
import {TokenDescriptionDialog} from './TokenDescriptionDialog';
import { getThemeProps } from '@material-ui/styles';

const updateCredentialDeleted = gql`
mutation updateCredentialDeletedMutation($token_id: Int!, $deleted: Boolean!){
    update_token_by_pk(pk_columns: {id: $token_id}, _set: {deleted: $deleted}) {
        deleted
        id
    }
}
`;
const updateCallbacksOfDeletedToken = gql`
mutation updateCallbacksOfDeletedTokenMutation($token_id: Int!, $deleted: Boolean!){
    update_callbacktoken(where: {token_id: {_eq: $token_id}}, _set: {deleted: $deleted}) {
        affected_rows
    }
}
`;

export function TokenTable(props){
    const [tokens, setTokens] = React.useState([]);
    useEffect( () => {
        setTokens([...props.tokens]);
    }, [props.credentials]);

    const onEditDeleted = ({id, deleted}) => {
        const updates = tokens.map( (cred) => {
            if(cred.id === id){
                return {...cred, deleted}
            }else{
                return {...cred}
            }
        });
        setTokens(updates);
    }

    return (
        <TableContainer component={Paper} className="mythicElement" style={{height: "calc(78vh)"}}>
            <Table stickyHeader size="small" style={{"maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}>Delete</TableCell>
                        <TableCell >User</TableCell>
                        <TableCell >Groups</TableCell>
                        <TableCell >TokenId</TableCell>
                        <TableCell >Logon Session</TableCell>
                        <TableCell >Description</TableCell>
                        <TableCell >Task</TableCell>
                        <TableCell >Callbacks With Handles</TableCell>
                        <TableCell >Host</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {tokens.map( (op) => (
                    <TokenTableRow
                        key={"cred" + op.id}
                        onEditDeleted={onEditDeleted}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function TokenTableRow(props){
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [viewTokenDialog, setViewTokenDialog] = React.useState(false);
    const [editDescriptionDialog, setEditDescriptionDialog] = React.useState(false);
    const [updateCallbackTokensDeleted] = useMutation(updateCallbacksOfDeletedToken, {
        onCompleted: (data) => {
            snackActions.success("Removed token from callback");
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const [updateDeleted] = useMutation(updateCredentialDeleted, {
        onCompleted: (data) => {
            snackActions.success("Updated deleted status");
            if(props.callbacktokens !== null && !props.deleted){
                //token was deleted, make sure to delete associated callback tokens too
                updateCallbackTokensDeleted({variables: {token_id: props.id, deleted: true}})
            }
            props.onEditDeleted(data.update_token_by_pk);
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const onAcceptDelete = () => {
        updateDeleted({variables: {token_id: props.id, deleted: !props.deleted}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDeleteDialog} acceptText={props.deleted ? "Restore" : "Remove" }/>
                
                <TableCell>{props.deleted ? (
                    <Tooltip title="Restore Token for use in Tasking">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.success.main}} variant="contained"><RestoreFromTrashIcon/></IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title="Delete Token so it can't be used in Tasking">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                    </Tooltip>
                )} </TableCell>
                <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.User}</Typography>
                    
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.Groups}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.TokenId}</Typography>
                    <Tooltip title="View Token Information"><IconButton size="small" color="primary" onClick={()=>{setViewTokenDialog(true);}}><ConfirmationNumberIcon/></IconButton></Tooltip>
                    <MythicDialog fullWidth={true} maxWidth="md" open={viewTokenDialog} 
                        onClose={()=>{setViewTokenDialog(false);}} 
                        innerDialog={<TaskTokenDialog token_id={props.id} onClose={()=>{setViewTokenDialog(false);}} />}
                    />
                </TableCell>
                <TableCell>
                    {props.logonsession === null ? (
                        <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>No Logon Session Data</Typography>
                    ) : (
                        <React.Fragment>
                            {props.logonsession.LogonId} {props.logonsession.LogonType !== null ? (" (" + props.logonsession.LogonType + ")") : (null)}
                        </React.Fragment>
                    )}
                    </TableCell>
                <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.description}</Typography>
                    <IconButton onClick={() => setEditDescriptionDialog(true)} size="small"><EditIcon /></IconButton>
                        <MythicDialog fullWidth={true} maxWidth="md" open={editDescriptionDialog} 
                            onClose={()=>{setEditDescriptionDialog(false);}} 
                            innerDialog={<TokenDescriptionDialog token_id={props.id} onClose={()=>{setEditDescriptionDialog(false);}}/>}
                        />
                </TableCell>
                <TableCell>
                    <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" 
                        href={"/new/task/" + props.task.id}>
                            {props.task.id}
                    </Link>
                </TableCell>
                <TableCell>{props.callbacktokens === null ? (null) : (
                    props.callbacktokens.map( (cbt) => (
                        cbt.callback_id
                    )))
                }</TableCell>
                <TableCell>{props.host}</TableCell>
            </TableRow>
        </React.Fragment>
    )
}

