#!/usr/bin/env python

###############################################################################
#
# The ftpsync utility will syncronize a local and a remote directory using
# the FTP protocol. The default behavior is to syncronize the remote directory
# with the local directory (upload), but it is also possible to perform a 
# reverse sync (download), so that the remote directory is the master.
#
# The utility works for both Windows and Linux clients and servers 
# (and any mix hereof).
#
# ----------------------------------------------------------------------------
#
# Inspired by a similar utility by Pearu Peterson. Some code have been reused.
# See http://ftpsync2d.googlecode.com.
#
# ----------------------------------------------------------------------------
#
# Copyright (c) 2011, Mikkel Elmholdt
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without 
# modification, are permitted provided that the following conditions are met:
#
# * Redistributions of source code must retain the above copyright notice, 
#   this list of conditions and the following disclaimer.
# * Redistributions in binary form must reproduce the above copyright notice, 
#   this list of conditions and the following disclaimer in the documentation 
#   and/or other materials provided with the distribution.
# * Neither the name of the <ORGANIZATION> nor the names of its contributors 
#   may be used to endorse or promote products derived from this software 
#   without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, 
# THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR 
# PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR 
# CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
# EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, 
# PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; 
# OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
# WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR 
# OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF 
# ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
# 
###############################################################################

"""
An FTP-based file syncronization tool.

"""

import sys
import os
import time

from ftplib         import FTP, error_perm,  error_temp
from optparse       import OptionParser
from fnmatch        import fnmatch


__version__ = "1.0.0"

ALLOWED_SLACK = 2


class FtpSyncHandler(object):
    """ FTP sync handler class """
    
    def __init__(self):
        self.createdDirectories = { }
        pass
    
    
    def handleArguments(self):
        """ Setup command line argument parser and parse arguments """
        
        usage = "usage: %prog [options] <remote path> <local path>"
        parser = OptionParser(usage=usage,
                              version="%prog "+__version__,
                              description="""
The %prog utility will syncronize a local and a remote directory using
the FTP protocol. The default behavior is to syncronize the remote directory
with the local directory (upload), but it is also possible to perform a reverse
sync (download), so that the remote directory is the master.

When performing a local-to-remote sync write access to the FTP server
is of course needed.
""".lstrip("\n"))
        
        parser.add_option("-a", "--address", dest="server_address",
                          help="Hostname or IP address of FTP server")
        parser.add_option("-p", "--port", dest="server_port", default=21,
                          help="Port number of FTP server")
        parser.add_option("-u", "--username", dest="username",
                          help="Username for FTP account")
        parser.add_option("-w", "--password", dest="password",
                          help="Password for FTP account")
        parser.add_option("-d", "--download", dest="isdownload", action="store_true",
                          default=False,
                          help="Download from remote to local directory")
        parser.add_option("-o", "--serveros", dest="serveros", default="Linux",
                          help="Server OS type ('Linux' or 'Windows'")
        parser.add_option("-b", "--basedir", dest="basedir", default="/",
                          help="Base directory for operations")
        parser.add_option("-i", "--ignore", dest="ignore", default=None,
                          help="File pattern to ignore")
    
        # run the parser
        (self.options, self.args) = parser.parse_args()

        # validate options and arguments
        if len(self.args) != 2:
            parser.error("Incorrect number of arguments!")
            
        self.remotePath = os.path.normpath(self.args[0])
        self.localPath = self.args[1]

        if self.options.server_address is None:
            parser.error("FTP server address is missing!")
            
        if None in [self.options.username, self.options.password]:
            parser.error("FTP username and/or password is missing!")
            
        if not self.options.serveros in ['Linux', 'Windows']:
            parser.error("Invalid server OS type!")
        
        
    def isServerLinux(self):
        """ Return True if the server OS is Linux and False if not """
        return (self.options.serveros == "Linux")
        
    def isClientLinux(self):
        """ Return True if the client OS is Linux and False if not """
        return (os.name in ["posix"])

        
    def formatRemotePath(self, pathname):
        """ Format a remote pathname according to the FTP server OS type """
        if self.isServerLinux():
            return pathname.replace('\\', '/')
        else:
            return pathname.replace('/', '\\')


    def formatLocalPath(self, pathname):
        """ Format a pathname according to the local OS type """
        return os.path.normpath(pathname)


    def _getLocalFiles(self, dirname):
        """ Get a list of files in the local directory """
        
        fileList = []
        
        try:
            entryList = os.listdir(dirname)
        except Exception, ex:
            print str(ex)
            sys.exit(1)
        
        for entryname in entryList:
            if fnmatch(entryname, self.options.ignore):
                continue
            fullentryname = os.path.join(dirname, entryname)
            if os.path.isdir(fullentryname):
                fileList.extend(self._getLocalFiles(fullentryname))
                
            elif os.path.isfile(fullentryname):
                fileList.append(fullentryname)
        
        return fileList

    def getLocalFiles(self):
        return self._getLocalFiles(self.localPath)


    def getServerTimestamp(self):
        """
        Sync the clocks between server and client by creating a small file in
        both places and comparing the timestamps.
        """

        # Create tempfile names and remove it if it already exists        
        thisdir = os.path.abspath(os.path.dirname(__file__))
        tempfile = '.ftpsync.clocksync'
        filename = os.path.join(thisdir, tempfile)
        if os.path.exists(filename):
            os.remove(filename)

        # Download
        try:
            remoteFile = self.formatRemotePath(os.path.join(self.remotePath, tempfile))
            print("Downloading timestamp " + remoteFile) 
            f = open(filename,'wb')
            self.ftpServer.retrbinary('RETR ' + remoteFile, f.write)
            f.close()
        except:
            return 0

        f = open(filename, 'rb')
        timestamp = f.read()
        f.close();

        if len(timestamp) == 0:
            return 0
        timestamp = int(timestamp)
        return timestamp


    def setServerTimestamp(self):

        # Create tempfile names
        thisdir = os.path.abspath(os.path.dirname(__file__))
        tempfile = '.ftpsync.clocksync'
        filename = os.path.join(thisdir, tempfile)

        # Set latest modification time
        f = open(filename, "wb")
        f.close()
        localModifTime = int(os.path.getmtime(tempfile))
        f = open(filename, "wb")
        f.write(str(localModifTime))
        f.close()

        # Upload
        try:
            remoteFile = self.formatRemotePath(os.path.join(self.remotePath, tempfile))
            print("Uploading timestamp " + remoteFile) 
            f = open(filename, 'rb')
            self.ftpServer.storbinary('STOR '+ remoteFile, f, 8*1024)
            f.close()
        except:
            return 0


    def connectFtpServer(self):
        """ Connect to the remote FTP server """
        
        try:
            self.ftpServer = FTP(self.options.server_address, self.options.username, self.options.password)
            print "Connected to FTP server '%s'" % self.options.server_address
            
        except error_perm, ex:
            print ""
            print "Connection to FTP server failed: %s" % (ex, )
            print ""
            sys.exit(1)
            
            
    def buildJobList(self, localFileList, timestamp):
        """
        Build a list of files that needs to be uploaded to the remote server
        """
        jobList = []
        
        for localFile in localFileList:
            localModifTime = int(os.path.getmtime(localFile))

            pathname, filename = os.path.split(localFile)
            index = len(self.localPath) + 1
            relpath = pathname[index:]
            tmpRemotePath = os.path.join(self.remotePath, relpath, filename)
            remotePath = self.formatRemotePath(tmpRemotePath)

            if timestamp < localModifTime:
                jobList.append((localFile, remotePath))
        
        return jobList


    def makeRemoteDir(self, fullpath):
        """ Create a possibly nested directory on the remote server """
        
        parent = os.path.dirname(fullpath)
        basename = os.path.basename(fullpath)

        if parent!='/':
            self.makeRemoteDir(parent)
        
        if fullpath in self.createdDirectories:
            return
        self.createdDirectories[fullpath] = True

        lst = self.ftpServer.nlst(parent)
        if not basename.startswith('/'):
            basename = '/' + basename
            
        cleanlst = [entry.lstrip('/') for entry in lst]
        cleanpath = fullpath.lstrip('/')
        
        if basename and cleanpath not in cleanlst:
            print('Creating directory %r ...' % (fullpath))
            try:
                self.ftpServer.mkd(fullpath)
            except:
                pass


    def executeJobList(self, jobList):
        """ Execute the job list """
        for localFile, remoteFile in jobList:
            pathname, filename = os.path.split(remoteFile)
            
            self.makeRemoteDir(pathname)
            
            print "Uploading %r ..." % remoteFile
            f = open(localFile, 'rb')
            self.ftpServer.storbinary('STOR '+ remoteFile, f, 8*1024)
            f.close()


    def main(self):
        """ Main class entry point """
        
        print ""
        print "ftpsync -  FTP syncronization tool, v%s" % __version__
        print ""
        
        self.handleArguments()

        # Connect to FTP server and synchronize the clocks
        self.connectFtpServer()
        timestamp = self.getServerTimestamp()
        
        print "Syncing remote directory '%s' ..." % self.formatRemotePath(self.remotePath)
        
        # Build the job list, i.e. a list of files that needs to be uploaded
        localFileList = self.getLocalFiles()
        jobList = self.buildJobList(localFileList, timestamp)
        uploadCounter = self.executeJobList(jobList)
        self.setServerTimestamp()

        print ""
        print "Done - checked %d files, uploaded %d files!" % (len(localFileList), len(jobList))
        print ""


if __name__ == "__main__":
    """ Script execution starting point """
    handler = FtpSyncHandler()
    handler.main()
    
