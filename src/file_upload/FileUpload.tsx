import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    Grid,
    Hidden,
    Paper,
    PaperProps,
    Typography,
    TypographyProps,
    useMediaQuery,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
// eslint-disable-next-line
// @ts-ignore
import uploadImage from '../assets/Files_And_Folder_Two.svg'
import FileAttachment from './FileAttachment'
import {
    ContextProps,
    FileProps,
    FileUploadProps,
    ImageDimensionProps,
    PlaceholderImageDimensionProps,
} from "./index.types.ts"
import { event } from "@tauri-apps/api";
import { TauriEvent } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';

const StyledContainer: React.FC<TypographyProps> = styled(Typography)(() => ({
    "&::-webkit-scrollbar": {
        width: 7,
        height: 6
    },
    "&::-webkit-scrollbar-track": {
        WebkitBoxShadow: "inset 0 0 6px rgb(125, 161, 196, 0.5)"
    },
    "&::-webkit-scrollbar-thumb": {
        WebkitBorderRadius: 4,
        borderRadius: 4,
        background: "rgba(0, 172, 193, .5)",
        WebkitBoxShadow: "inset 0 0 6px rgba(25, 118, 210, .5)"
    },
    "&::-webkit-scrollbar-thumb:window-inactive": {
        background: "rgba(125, 161, 196, 0.5)"
    }
}))

interface FileDropPayload {
    paths: string[]
    position: {
        x: number
        y: number
    }
}

async function getFileMetadata(path: string): Promise<FileProps> {
    try {
        const metadata = await invoke('get_file_metadata', { path });
        return metadata as FileProps;
    } catch (error) {
        throw error;
    }
}

function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) return '0 Byte';

    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));

    return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i];
}


/**
 * @name FileUpload
 * @description Upload file component wrapper
 * @param props FileUploadProps
 * @returns React.Component
 */
function FileUpload(props: FileUploadProps) {
    const {
        header,
        onError,
        disabled,
        imageSrc,
        getBase64,
        imageSrcAlt,
        leftLabel,
        rightLabel,
        buttonLabel,
        showUploadButton,
        maxFileSize,
        bannerProps,
        BannerProps,
        defaultFiles,
        onFilesChange,
        maxUploadFiles = 0,
        onContextReady,
        showPlaceholderImage,
        errorSizeMessage,
        allowedExtensions,
        buttonRemoveLabel,
        LabelsGridProps,
        PlaceholderGridProps,
        filesContainerHeight,
        maxFilesContainerHeight,
        placeholderImageDimension,
        PlaceholderImageDimension,
    } = props

    const theme = useTheme()

    // noinspection JSDeprecatedSymbols
    const bannerCompatibilityProps: object = { ...bannerProps, ...BannerProps }
    // noinspection JSDeprecatedSymbols
    const { lg, md, sm, xs }: PlaceholderImageDimensionProps = {
        ...placeholderImageDimension,
        ...PlaceholderImageDimension
    }

    const [error, setError] = useState<string | null>()
    const [action, setAction] = useState<FileProps[] | null>()
    const [animate, setAnimate] = useState<boolean>()
    const [files, setFiles] = useState<FileProps[]>([])
    const originalFiles = useRef<FileProps[]>([])

    const buttonDeleteRef = useRef<HTMLButtonElement | null>(null)
    let imageDimension: ImageDimensionProps = { width: 128, height: 128 }

    if (useMediaQuery(theme.breakpoints.up('xs')) && xs) {
        imageDimension = xs
    }

    if (useMediaQuery(theme.breakpoints.up('sm')) && sm) {
        imageDimension = sm
    }

    if (useMediaQuery(theme.breakpoints.up('md')) && md) {
        imageDimension = md
    }

    if (useMediaQuery(theme.breakpoints.up('lg')) && lg) {
        imageDimension = lg
    }

    /**
     * @name addFile
     * @description
     * @param addFiles
     * @returns void
     */
    const addFile = (addFiles: FileProps[]): boolean => {
        setAnimate(false)
        setError(null)

        if ((!addFiles || addFiles.length === 0) && onError) {
            onError(`Empty file input`)
            return false
        }

        if (maxUploadFiles) {
            if ((maxUploadFiles - addFiles.length <= 0) && onError) {
                const errorMessage = `You cannot attach more than ${maxUploadFiles} files`

                setError(errorMessage)
                onError(errorMessage)
                return false
            }
        }

        // eslint-disable-next-line
        // @ts-ignore
        for (let i = 0; i < addFiles.length; i++) {
            // eslint-disable-next-line
            // @ts-ignore
            const file = addFiles[i]
            const extension = file.extension?.toLowerCase() || ''
            if (maxFileSize && maxFileSize > 0) {
                if (file.size > (1024 * 1024 * maxFileSize)) {
                    const message = (
                        errorSizeMessage
                        || `The size of files cannot exceed ${maxFileSize}Mb`
                    )

                    setError(message)
                    if (onError) {
                        onError(message)
                    }

                    continue
                }
            }

            if (allowedExtensions && allowedExtensions.length > 0) {
                const isAllowed = allowedExtensions
                    .findIndex(
                        (ext: string) => ext.toLowerCase() === extension
                    ) !== -1

                if (!isAllowed) {
                    const errorMessage = `Extension .${extension} has been excluded`

                    setError(errorMessage)
                    if (onError) {
                        onError(errorMessage)
                    }

                    continue
                }
            }
            originalFiles.current.push(file)
            setFiles([...originalFiles.current])
        }
        return true
    }

    const openFileDialog = () => {
        (async () => {
            const openFiles = await open({
                multiple: true,
                directory: false,
            })
            if (!openFiles) {
                return
            }
            let files: FileProps[] = []
            for (const file of openFiles) {
                if (!file) {
                    continue
                }
                let path = file.path
                let isExist = originalFiles.current.find(file => {
                    if (file.path == path) {
                        return file
                    }
                })
                if (isExist) {
                    // already exists
                    continue
                }
                let metadata = await getFileMetadata(path)
                metadata.progress = 0
                files.push(metadata)
            }
            setAction(files)
        })()
    }

    /**
     * @name removeFile
     * @description
     * @param event
     * @param index
     * @returns void
     */
    // eslint-disable-next-line
    // @ts-ignore
    const removeFile = (event: MouseEvent<HTMLButtonElement, MouseEvent>, index?: number): void | object => {
        setError(null)
        if (typeof index !== 'number') {
            setFiles([])
            originalFiles.current = []
            return
        }

        if (index < 0 || index > files.length - 1) {
            return console.error("item's index not found...")
        }

        const deletedFile = { ...files[index] }

        files?.splice(index, 1)
        originalFiles.current?.splice(index, 1)

        setFiles([...files])
        originalFiles.current = [...originalFiles.current]

        return deletedFile
    }

    /**
     * @name getContext
     * @description
     * @returns {{input: undefined, removeFile: removeFile, files: *[], addFile: addFile}}
     */
    const getContext = (): ContextProps => ({
        addFile: addFile,
        removeFile: removeFile,
        files: getBase64 ? files : originalFiles.current
    })

    useEffect(() => {
        if (
            defaultFiles
            && defaultFiles.length > 0
            && files.length !== defaultFiles.length) {
            setFiles(defaultFiles)
        }
        // eslint-disable-next-line
    }, [defaultFiles])

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined;
        (async () => {
            unlisten = await event.listen(TauriEvent.WINDOW_FILE_DROP_CANCELLED, async _ => {
                setAnimate(false)
            })
        })()
        return () => {
            unlisten?.()
        }
    }, []);

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined;
        (async () => {
            unlisten = await event.listen(TauriEvent.WINDOW_FILE_DROP_HOVER, async _ => {
                setAnimate(true)
            })
        })()
        return () => {
            unlisten?.()
        }
    }, []);

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined;
        (async () => {
            unlisten = await event.listen(TauriEvent.WINDOW_FILE_DROP, async (e: event.Event<FileDropPayload>) => {
                setAnimate(false)
                const paths = e.payload.paths
                if (!paths) {
                    return
                }
                let add_files: FileProps[] = []
                for (const path of paths) {
                    if (!path) {
                        continue
                    }
                    let isExist = originalFiles.current.find(file => {
                        if (file.path == path) {
                            return file
                        }
                    })
                    if (isExist) {
                        // already exists
                        continue
                    }
                    let metadata = await getFileMetadata(path)
                    metadata.progress = 0
                    add_files.push(metadata)
                }
                setAction(add_files)
            })
        })()
        return () => {
            unlisten?.()
        }
    }, [])

    useEffect(() => {
        if (action) {
            // eslint-disable-next-line
            // @ts-ignore
            addFile(action)
            setAction(null)
        }

        if (onFilesChange) {
            onFilesChange(getBase64 ? files : originalFiles.current)

            if (onContextReady) {
                onContextReady(getContext())
            }
        }
        // eslint-disable-next-line
    }, [files, action])

    const background: string = animate ?
        theme.palette.secondary.light : theme.palette.primary.light
    return (
        <>
            <Paper
                elevation={0}
                sx={{ p: 1, transition: 500, background }}
                {...bannerCompatibilityProps}
            >
                <Grid
                    item
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                >
                    {showPlaceholderImage &&
                        <Grid
                            item
                            xs={12} sm={3} md={4}
                            sx={{ textAlign: 'center', mt: { xs: -3, sm: 2 } }}
                            {...PlaceholderGridProps}
                        >
                            <img
                                alt={imageSrcAlt}
                                src={imageSrc || uploadImage}
                                width={imageDimension.width}
                                height={imageDimension.height}
                            />
                        </Grid>}

                    <Grid
                        item
                        xs={12} sm md
                        sx={{
                            color: "#fff",
                            textAlign: 'center',
                            mt: { xs: showPlaceholderImage ? -4 : 0, sm: 2 }
                        }}
                        {...LabelsGridProps}
                    >
                        <Hidden smDown>
                            <Typography component="div" variant="h5">
                                <b>{header}</b>
                            </Typography>
                        </Hidden>
                        <Hidden smUp>
                            <Typography component="div" variant="h6">
                                <b>{header}</b>
                            </Typography>
                        </Hidden>
                        {showUploadButton &&
                            <Typography variant="caption">
                                {leftLabel}
                                <Button
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    disabled={disabled}
                                    onClick={openFileDialog}
                                    sx={{
                                        m: .5,
                                        color: theme.palette.grey["50"],
                                        borderColor: theme.palette.grey["50"],
                                        '&:hover': {
                                            borderColor: theme.palette.grey["50"]
                                        }
                                    }}
                                >
                                    {buttonLabel}
                                </Button>
                                {rightLabel}
                            </Typography>}
                    </Grid>
                </Grid>
            </Paper>

            <Typography
                gutterBottom
                component="div"
                color="textSecondary"
                sx={{ display: 'flex' }}
            >
                {files?.length > 0 &&
                    <Box sx={{ fontSize: 12 }}>
                        {files.length}

                        {maxUploadFiles > 0 &&
                            `/${maxUploadFiles}`} file{files?.length > 1 && 's'} joined
                    </Box>}
            </Typography>

            {error &&
                <Alert
                    color="error"
                    severity="error"
                    sx={{ mt: 1 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>}

            {files?.length > 0 &&
                <React.Fragment>
                    <StyledContainer
                        // eslint-disable-next-line
                        // @ts-ignore
                        component="div"
                        sx={{
                            overflowY: "auto",
                            mt: 2, mr: -1, pr: 1,
                            height: filesContainerHeight,
                            maxHeight: maxFilesContainerHeight
                        }}
                    >
                        {files?.map((file, index) => {
                            return (
                                <FileAttachment
                                    file={file}
                                    size={formatFileSize(file.size)}
                                    index={index}
                                    disabled={disabled}
                                    key={`upload-file--${index}`}
                                    handleRemoveFile={removeFile}
                                />
                            )
                        })}
                    </StyledContainer>

                    <Typography component="div" align="right" sx={{ mt: 1 }}>
                        <Button
                            size="small"
                            disabled={disabled}
                            onClick={removeFile}
                            ref={buttonDeleteRef}
                        >
                            {buttonRemoveLabel || 'Remove all'}
                        </Button>
                    </Typography>
                </React.Fragment>}
        </>
    )
}

FileUpload.propTypes = {
    getBase64: PropTypes.bool,
    maxUploadFiles: PropTypes.number,
    header: PropTypes.string,
    leftLabel: PropTypes.string,
    rightLabel: PropTypes.string,
    buttonLabel: PropTypes.string,
    showUploadButton: PropTypes.bool,
    multiFile: PropTypes.bool,
    disabled: PropTypes.bool,
    maxFileSize: PropTypes.number,
    maxFilesContainerHeight: PropTypes.number,
    errorSizeMessage: PropTypes.string,
    imageSrc: PropTypes.string,
    imageSrcAlt: PropTypes.string,
    acceptedType: PropTypes.string,
    bannerProps: PropTypes.object,
    BannerProps: PropTypes.object,
    containerProps: PropTypes.object,
    ContainerProps: PropTypes.object,
    allowedExtensions: PropTypes.array,
    onError: PropTypes.func,
    onContextReady: PropTypes.func,
    onFilesChange: PropTypes.func,
    showPlaceholderImage: PropTypes.bool,
    LabelsGridProps: PropTypes.object,
    PlaceholderGridProps: PropTypes.object,
    placeholderImageDimension: PropTypes.object,
    PlaceholderImageDimension: PropTypes.object,
}

FileUpload.defaultProps = {
    getBase64: false,
    multiFile: true,
    maxFileSize: 0,
    maxUploadFiles: 0,
    acceptedType: "*/*",
    allowedExtensions: [],
    header: ">[Drag to drop]<",
    leftLabel: "or",
    rightLabel: "to select files",
    buttonLabel: "click here",
    showUploadButton: true,
    imageSrcAlt: "Placeholder image",
    maxFilesContainerHeight: 130,
    showPlaceholderImage: false,
    placeholderImageDimension: {},
    PlaceholderImageDimension: {},
    bannerProps: {},
    BannerProps: {},
    containerProps: {},
    ContainerProps: {},
    LabelsGridProps: {},
    PlaceholderGridProps: {},
} as Partial<PaperProps>

export default FileUpload