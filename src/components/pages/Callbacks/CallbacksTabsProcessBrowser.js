import {MythicTabPanel, MythicTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React, {useEffect} from 'react';
import {gql, useLazyQuery, useQuery } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import MythicTextField from '../../MythicComponents/MythicTextField';
import { useReactiveVar } from '@apollo/client';
import { meState } from '../../../cache';
import {useTheme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import RefreshIcon from '@material-ui/icons/Refresh';
import IconButton from '@material-ui/core/IconButton';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import {CallbacksTabsProcessBrowserTree} from './CallbacksTabsProcessBrowserTree';
import {CallbacksTabsProcessBrowserTable} from './CallbacksTabsProcessBrowserTable';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import {MythicModifyStringDialog} from '../../MythicComponents/MythicDialog';
import LockIcon from '@material-ui/icons/Lock';
import {TaskFromUIButton} from './TaskFromUIButton';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

const dataFragment = gql`
fragment objData on process {
    name
    process_id
    parent_process_id
    architecture
    bin_path
    integrity_level
    id
    user
}
`;
const taskFragment = gql`
fragment taskDataProcess on task {
    id
    callback {
        id
        host
        payload {
            id
            os
            payloadtype{
                ptype
            }
        }
    }
}
`;
const getNextProcessQuery = gql`
${dataFragment}
${taskFragment}
query getHostProcessesQuery($operation_id: Int!, $host: String!, $task_id: Int!) {
    process(where: {operation_id: {_eq: $operation_id}, host: {_eq: $host}, task_id: {_gt: $task_id}}, order_by: {task_id: asc}, limit: 1) {
        task {
            ...taskDataProcess
            processes(order_by: {process_id: asc}) {
                ...objData
            }
        }
    }
  }
`;
const getPrevProcessQuery = gql`
${dataFragment}
${taskFragment}
query getHostProcessesQuery($operation_id: Int!, $host: String!, $task_id: Int!) {
    process(where: {operation_id: {_eq: $operation_id}, host: {_eq: $host}, task_id: {_lt: $task_id}}, order_by: {task_id: desc}, limit: 1) {
        task {
            ...taskDataProcess
            processes(order_by: {name: asc}) {
                ...objData
            }
        }
    }
  }
`;
const getLatestTaskForHost = gql`
query getHostsQuery($operation_id: Int!, $host:String!){
    process_aggregate(where: {operation_id: {_eq: $operation_id}, host: {_eq: $host}}, distinct_on: task_id){
        aggregate {
            max {
              task_id
            }
        }
    }
}
`;

export function CallbacksTabsProcessBrowserLabel(props){
    const [description, setDescription] = React.useState("Processes: " + props.tabInfo.host)
    const [openEditDescriptionDialog, setOpenEditDescriptionDialog] = React.useState(false);
    const onContextMenu = (event) => {
        event.stopPropagation();
        event.preventDefault();
        setOpenEditDescriptionDialog(true);
    }
    useEffect( () => {
        if(props.tabInfo.customDescription !== "" && props.tabInfo.customDescription !== undefined){
            setDescription(props.tabInfo.customDescription);
        }else{
            setDescription("Processes: " + props.tabInfo.host);
        }
    }, [props.tabInfo.customDescription])
    const editDescriptionSubmit = (description) => {
        props.onEditTabDescription(props.tabInfo, description);
    }
    return (
        <React.Fragment>
            <MythicTabLabel label={description} onContextMenu={onContextMenu} {...props}/>
            {openEditDescriptionDialog &&
                <MythicDialog fullWidth={true} open={openEditDescriptionDialog}  onClose={() => {setOpenEditDescriptionDialog(false);}}
                    innerDialog={
                        <MythicModifyStringDialog title={"Edit Tab's Description"} onClose={() => {setOpenEditDescriptionDialog(false);}} value={description} onSubmit={editDescriptionSubmit} />
                    }
                />
            }
        </React.Fragment>  
    )
}
export const CallbacksTabsProcessBrowserPanel = ({index, value, tabInfo}) =>{
    const me = useReactiveVar(meState);
    const fileBrowserRoots = React.useRef([]);
    const [fileBrowserRootsState, setFileBrowserRootsState] = React.useState([]);
    const [selectedFolder, setSelectedFolder] = React.useState([]);
    const [taskInfo, setTaskInfo] = React.useState({});
    const currentCallbackIDSetInTable = React.useRef();
    const [currentOS, setCurrentOS] = React.useState("");
    const [openTaskingButton, setOpenTaskingButton] = React.useState(false);
    const taskingData = React.useRef({"parameters": "", "ui_feature": "process_browser:list"});
    const makeTree = (root, element) => {
        if(root.process_id === element.parent_process_id){
            root.children.push({...element, children: []});
            return true;
        }else{
            // root isn't what we're looking for, but maybe a child of root is
            for(let i = 0; i < root.children.length; i++){
                if(makeTree(root.children[i], element)){
                    return true;
                }
            }
        }
        return false;
    }
    const [getNextProcessDataByHostAndTask] = useLazyQuery(getNextProcessQuery, {
        onError: data => {
            console.error(data)
        },
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if(data.process.length > 0){
                const dataTree = data.process[0].task.processes.reduce( (prev, cur) => {
                    if(cur.parent_process_id === null || cur.parent_process_id <= 0){
                        return [...prev, {...cur, children: []}]
                    }else{
                        // this means there is a parent id
                        // go through the current high level parent processes 
                        const updated = [...prev].map( (root) => {
                            makeTree(root, cur);
                            return {...root};
                        });
                        return [...updated];
                    }
                }, []);
                setFileBrowserRootsState(dataTree);
                setSelectedFolder(data.process[0].task.processes);
                setCurrentOS(data.process[0].task.callback.payload.os);
                setTaskInfo(data.process[0].task);
                snackActions.dismiss();
                snackActions.success("Successfully fetched process data");
            }else{
                snackActions.dismiss();
                snackActions.warning("No Newer Process Sets");
            }
            
        }
    });
    
    const [getPreviousProcessDataByHostAndTask] = useLazyQuery(getPrevProcessQuery, {
        onError: data => {
            console.error(data)
        },
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if(data.process.length > 0){
                const dataTree = data.process[0].task.processes.reduce( (prev, cur) => {
                    if(cur.parent_process_id === null || cur.parent_process_id <= 0){
                        return [...prev, {...cur, children: []}]
                    }else{
                        // this means there is a parent id
                        // go through the current high level parent processes 
                        const updated = [...prev].map( (root) => {
                            makeTree(root, cur);
                            return {...root};
                        });
                        return [...updated];
                    }
                }, []);
                setFileBrowserRootsState(dataTree);
                setSelectedFolder(data.process[0].task.processes);
                setCurrentOS(data.process[0].task.callback.payload.os);
                setTaskInfo(data.process[0].task);
                snackActions.dismiss();
                snackActions.success("Successfully fetched process data");
            }else{
                snackActions.dismiss();
                snackActions.warning("No Earlier Process Sets");
            }
            
        }
    });
    useQuery(getLatestTaskForHost, {
        variables: {operation_id: me.user.current_operation_id, host: tabInfo.host},
        onCompleted: (data) => {
            if(data.process_aggregate.aggregate.max.task_id === null){
                snackActions.warning("No Process Data for " + tabInfo.host)
                setTaskInfo({callback: {host: tabInfo.host, id: tabInfo.callbackID}, id: 0})
            }else{
                snackActions.info("Fetching latest process data for " + tabInfo.host);
                getNextProcessDataByHostAndTask({variables: {operation_id: me.user.current_operation_id, 
                    host: tabInfo.host,
                    task_id: data.process_aggregate.aggregate.max.task_id - 1
                }});
            }
        }, fetchPolicy: "network-only"
    });
    useEffect( () => {
        fileBrowserRoots.current = fileBrowserRootsState;
    }, [fileBrowserRootsState])

    const onListFilesButton = ({callbackID}) => {
        taskingData.current = ({"parameters": "", "ui_feature": "process_browser:list"});
        setOpenTaskingButton(true);
    }
    const onNextButton = ({task_id}) => {
        getNextProcessDataByHostAndTask({variables: {operation_id: me.user.current_operation_id, 
            host: tabInfo.host,
            task_id: task_id
        }})
    }
    const onPreviousButton = ({task_id}) => {
        getPreviousProcessDataByHostAndTask({variables: {operation_id: me.user.current_operation_id, 
            host: tabInfo.host,
            task_id: task_id
        }})
    }
    const onDiffButton = ({task_id}) => {
        
    }
    const onTaskRowAction = ({path, host, filename, uifeature}) => {
        console.log(path, host, filename, uifeature);
    }
    const onChangeCallbackID = (callbackID) => {
        currentCallbackIDSetInTable.current = callbackID;
    }
    return (
        <MythicTabPanel index={index} value={value} >
            <div style={{display: "flex", flexGrow: 1, overflowY: "auto"}}>
                <div style={{width: "30%", overflow: "auto", flexGrow: 1}}>
                    <CallbacksTabsProcessBrowserTree 
                        treeRoot={fileBrowserRootsState} />
                </div>
                <div style={{width: "60%", display: "flex", flexDirection: "column", overflow: "auto", flexGrow: 1}}>
                    <ProcessBrowserTableTop
                        onListFilesButton={onListFilesButton} 
                        onNextButton={onNextButton} 
                        onPreviousButton={onPreviousButton}
                        onDiffButton={onDiffButton}  
                        initialCallbackID={tabInfo.callbackID}
                        onChangeCallbackID={onChangeCallbackID}
                        taskInfo={taskInfo}/>
                    <CallbacksTabsProcessBrowserTable selectedFolder={selectedFolder} onTaskRowAction={onTaskRowAction} os={currentOS}/>
                </div>
                {openTaskingButton && 
                    <TaskFromUIButton ui_feature={taskingData.current?.ui_feature || " "} 
                        callback_id={currentCallbackIDSetInTable.current} 
                        parameters={taskingData.current?.parameters || ""}
                        onTasked={() => setOpenTaskingButton(false)}/>
                    }
            </div>            
        </MythicTabPanel>
    )
}
const ProcessBrowserTableTop = ({onListFilesButton, onNextButton, onPreviousButton, initialCallbackID, onDiffButton, onChangeCallbackID, taskInfo}) => {
    const theme = useTheme();
    const [hostname, setHostname] = React.useState("");
    const [callbackID, setCallbackID] = React.useState(initialCallbackID);
    const [manuallySetCallbackID, setManuallySetCallbackID] = React.useState(true);
    const [taskID, setTaskID] = React.useState(0);
    const onChangeID = (name, value, error) => {
        setManuallySetCallbackID(true);
        setCallbackID(parseInt(value));
    }
    const revertCallbackID = () => {
        setManuallySetCallbackID(false);
        if(taskInfo.callback !== undefined){
            setCallbackID(taskInfo.callback.id);
        }else{
            setCallbackID(0);
        }
        
    }
    useEffect( () => {
        if(taskInfo.callback !== undefined){
            setHostname(taskInfo.callback.host);    
            setTaskID(taskInfo.id);
        }
        if(!manuallySetCallbackID){
            if(taskInfo.callback !== undefined){
                setCallbackID(taskInfo.callback.id);
            }else{
                setCallbackID(0);
            }
            
        }
    }, [taskInfo, manuallySetCallbackID]);
    const onLocalListFilesButton = () => {
        if(callbackID > 0){
            onListFilesButton({callbackID})
        }else{
            snackActions.warning("Must set a callback number to task first");
        }
    }
    const onLocalNextButton = () => {
        snackActions.info("Fetching next process data...");
        onNextButton({task_id: taskInfo.id});
    }
    const onLocalPreviousButton = () => {
        snackActions.info("Fetching previous process data...");
        onPreviousButton({task_id: taskInfo.id});
    }
    const onLocalDiffButton = () => {
        if(callbackID > 0){
            onNextButton({callbackID});
        }else{
            snackActions.warning("Must select a callback number first");
        }
    }
    useEffect( () => {
        onChangeCallbackID(callbackID);
    }, [callbackID, onChangeCallbackID])
    return (
        <Grid container spacing={0} style={{paddingTop: "10px"}}>
            <Grid item xs={10}>
                <MythicTextField placeholder="Host Name" value={hostname} disabled
                    onChange={() => {}} name="Host Name" InputProps={{
                        endAdornment: 
                        <React.Fragment>
                            <MythicStyledTooltip title="Fetch Previous Saved Process Listing">
                                <IconButton style={{padding: "3px"}} onClick={onLocalPreviousButton}><SkipPreviousIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title="Task Callback to List Processes">
                                <IconButton style={{padding: "3px"}} onClick={onLocalListFilesButton}><RefreshIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title="Fetch Next Saved Process Listing">
                                <IconButton style={{padding: "3px"}} onClick={onLocalNextButton}><SkipNextIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title="Compare Previous Listing">
                                <IconButton style={{padding: "3px"}} onClick={onLocalDiffButton}><CompareArrowsIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                        </React.Fragment>
                    }} />
            </Grid>
            <Grid item xs={1}>
                <MythicTextField type="number" placeholder="Callback" name="Callback"
                    onChange={onChangeID} value={callbackID} InputProps={{
                        endAdornment: manuallySetCallbackID ? (
                            <MythicStyledTooltip title="Change Callback Based on Data Origin">
                                <IconButton style={{padding: "3px"}} onClick={revertCallbackID}>
                                    <LockIcon style={{color: theme.palette.info.main}}/>
                                </IconButton>
                            </MythicStyledTooltip>
                        ) : (<MythicStyledTooltip title="Manually Update Callback Number to Prevent Data Origin Tracking">
                                <IconButton  style={{padding: "3px"}}>
                                    <RotateLeftIcon disabled style={{color: theme.palette.warning.main}}/> 
                                </IconButton>
                            </MythicStyledTooltip>),
                        style: {padding: 0, margin: 0}
                    }}/>
            </Grid>
            <Grid item xs={1}>
                <MythicTextField type="number" name="Task Data"
                    disabled value={taskID} onChange={() => {}}/>
            </Grid>
        </Grid>
    )
}
