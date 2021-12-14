import React, { useEffect } from 'react';
import {IconButton, Typography, Link} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import {useTheme} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';

const stopSocks = gql`
mutation StopSocksMutation($callback_id: Int!){
    stop_socks(callback_id: $callback_id){
        status
        error
    }
}
`;

export function SocksSearchTable(props){
    const [callbacks, setCallbacks] = React.useState([]);
    useEffect( () => {
        setCallbacks([...props.callbacks]);
    }, [props.callbacks]);

    const onEditDeleted = ({id, active}) => {
        const updates = callbacks.map( (cred) => {
            if(cred.id === id){
                return {...cred, port: null}
            }else{
                return {...cred}
            }
        });
        setCallbacks(updates);
    }

    return (
        <TableContainer component={Paper} className="mythicElement" style={{height: "calc(78vh)"}}>
            <Table stickyHeader size="small" style={{"maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}>Stop</TableCell>
                        <TableCell >User</TableCell>
                        <TableCell >Domain</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Description</TableCell>
                        <TableCell >ID</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {callbacks.map( (op) => (
                    <CallbackSearchTableRow
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

function CallbackSearchTableRow(props){
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

    const [updateDeleted] = useMutation(stopSocks, {
        onCompleted: (data) => {
            snackActions.success("Stopped Socks on that Port");
            props.onEditDeleted({id: props.id});
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const onAcceptDelete = () => {
        updateDeleted({variables: {callback_id: props.id}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDeleteDialog} acceptText={"Stop Socks"}/>
                
                <TableCell>{props.port ? (
                    <Tooltip title="Stop Socks Port on Mythic Server">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                    </Tooltip>
                ) : ( null )} </TableCell>
                <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.user}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.domain}</Typography>
                </TableCell>
                <TableCell>{props.host}</TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.description}</Typography>
                </TableCell>
                <TableCell>
                <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" 
                        href={"/new/callbacks/" + props.id}>
                            {props.id}
                    </Link>
                </TableCell>
                
            </TableRow>
        </React.Fragment>
    )
}

